import { Input } from "@nextui-org/react";
import {
  Card,
  Col,
  Row,
  Button,
  Text,
  Modal,
  useModal,
  Avatar,
  Grid,
  Spacer,
} from "@nextui-org/react";
import React from "react";
import { useState, useEffect } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import qs from "qs";
import Erc20 from "../engine/erc20.json";
import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";
import truncateEthAddress from "truncate-eth-address";

export default function Defiswap() {
  const { visible, setVisible } = useModal();
  const [flogo, getFromLogo] = useState([]);
  const [fname, getFromName] = useState(["Swap From"]);
  const [faddr, getFromAddr] = useState([]);
  const [fdec, getFromDec] = useState([]);
  const [tlogo, getToLogo] = useState([]);
  const [tname, getToName] = useState(["Swap To"]);
  const [taddr, getToAddr] = useState([]);
  const [tdec, getToDec] = useState([]);
  const [holdup, setHold] = useState("");
  const [wallet, getWallet] = useState([]);
  const [alert, setAlert] = useState(false);
  const [swap, setSwap] = useState(false);
  const [walletConnect, setWalletConnect] = useState(false);
  const [price, setPrice] = useState([]);
  const [orders, setOrder] = useState([]);

  const config = {
    apiKey: "6vk4ND2nxNThz8mY_RnIjbaiq7TeETMJ",
    network: Network.ETH_MAINNET,
  };

  const alchemy = new Alchemy(config);

  var zeroxapi = "https://api.0x.org";

  useEffect(() => {}, [
    getFromLogo,
    getFromName,
    getFromAddr,
    getFromDec,
    setPrice,
    setOrder,
  ]);

  useEffect(() => {}, [getToLogo, getToName, getToAddr]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getPrice();
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [holdup]);

  let currentTrade = {};
  let currentSelectSide = null;
  let toTrade = {};
  let toSelectSide = null;

  const sendAlert = () => setAlert(true);

  const fromHandler = (side) => {
    if (wallet.includes("0x")) {
      setVisible(true);
      currentSelectSide = side;
      listFromTokens();
    } else {
      sendAlert();
    }
  };

  const toHandler = (side) => {
    setVisible(true);
    toSelectSide = side;
    listToTokens();
    getPrice();
  };

  var account = null;
  var web3 = null;

  const closeHandler = () => {
    setVisible(false);
    setAlert(false);
    setSwap(false);
    setWalletConnect(false);
    console.log("closed");
  };

  async function modalWallet() {
    setWalletConnect(true);
  }

  async function connect() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    web3 = new Web3(connection);
    await connection.send("eth_requestAccounts");
    var accounts = await web3.eth.getAccounts();
    account = accounts[0];
    if (account !== null) {
      document.getElementById("status").textContent =
        truncateEthAddress(account);
    } else {
      document.getElementById("status").textContent = "CONNECT";
    }
    getWallet(account);
    closeHandler();
  }
  async function onDisconnect() {
    document.getElementById("status").textContent = "CONNECT";
    closeHandler();
  }
  async function swapToken() {
    setSwap(true);
    if (!faddr || !taddr || !document.getElementById("from_amount").value)
      return;
    let amount = Number(
      document.getElementById("from_amount").value * 10 ** fdec
    );
    const params = {
      sellToken: faddr,
      buyToken: taddr,
      sellAmount: amount,
    };
    const response = await fetch(
      zeroxapi + `/swap/v1/price?${qs.stringify(params)}`
    );
    const sources = await fetch(
      zeroxapi + `/swap/v1/quote?${qs.stringify(params)}`
    );
    var swapPriceJSON = await response.json();
    var swapOrders = await sources.json();
    try {
      await swapOrders.orders.find((item) => {
        document.getElementById("liquid_provider").innerHTML = item.source;
      });
    } catch (error) {
      document.getElementById("liquid_provider").innerHTML =
        "Pool Not Available";
    }
    var rawvalue = swapOrders.buyAmount / 10 ** tdec;
    var value = rawvalue.toFixed(2);
    var sellvalue = swapOrders.sellAmount / 10 ** fdec;
    var sell = sellvalue.toFixed(2);
    document.getElementById("raw").innerHTML = value;
    document.getElementById("minimum_reveived").innerHTML = value;
    document.getElementById("sell_value").innerHTML = sell;
    document.getElementById("estimate_gas").innerHTML =
      swapPriceJSON.estimatedGas;
    console.log(swapPriceJSON);
    console.log(swapOrders);
  }

  async function listFromTokens() {
    let response = await fetch("http://localhost:3000/api/tokens");
    let tokenListJSON = await response.json();
    var tokens = tokenListJSON.tokens;
    let parent = document.getElementById("token_list");
    for (const i in tokens) {
      let div = document.createElement("div");
      div.className = "token_row";
      let html = `
          <img className="token_list_img" width="12%" src="${tokens[i].logoURI}">
            <span className="token_list_text">${tokens[i].symbol}</span>
            `;
      div.innerHTML = html;
      div.onclick = () => {
        selectFrom(tokens[i]);
      };
      parent.appendChild(div);
    }
  }

  function selectFrom(token) {
    currentTrade[currentSelectSide] = token;
    closeHandler();
    var fromName = token.name;
    var fromLogo = token.logoURI;
    var fromAddr = token.address;
    var fromDec = token.decimals;
    getFromName(fromName);
    getFromLogo(fromLogo);
    getFromAddr(fromAddr);
    getFromDec(fromDec);
  }

  async function displayBalance() {
    const tokenContractAddresses = [faddr];
    const data = await alchemy.core.getTokenBalances(
      wallet,
      tokenContractAddresses
    );
    data.tokenBalances.find((item) => {
      let rawbalance = parseInt(item.tokenBalance, 16).toString();
      let formatbalance = Number(Web3.utils.fromWei(rawbalance));
      let balance = formatbalance.toFixed(2);
      if (
        item.tokenBalance ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        document.getElementById("get_balance").innerHTML = "0.00";
      } else {
        document.getElementById("get_balance").innerHTML = balance;
      }
    });
  }

  async function listToTokens() {
    let response = await fetch("http://localhost:3000/api/tokens");
    let tokenListJSON = await response.json();
    var tokens = tokenListJSON.tokens;
    let parent = document.getElementById("token_list");
    for (const i in tokens) {
      let div = document.createElement("div");
      div.className = "token_row";
      let html = `
        <img className="token_list_img" width="12%" src="${tokens[i].logoURI}">
        <span className="token_list_text">${tokens[i].symbol}</span>
          `;
      div.innerHTML = html;
      div.onclick = () => {
        selectTo(tokens[i]);
      };
      parent.appendChild(div);
    }
  }

  function selectTo(token) {
    toTrade[toSelectSide] = token;
    closeHandler();
    var toName = token.name;
    var toLogo = token.logoURI;
    var toAddr = token.address;
    var toDec = token.decimals;
    getToName(toName);
    getToLogo(toLogo);
    getToAddr(toAddr);
    getToDec(toDec);
    displayBalance();
  }
  async function getPrice() {
    console.log("Getting Price");
    if (!faddr || !taddr || !document.getElementById("from_amount").value)
      return;
    let amount = Number(
      document.getElementById("from_amount").value * 10 ** fdec
    );
    const params = {
      sellToken: faddr,
      buyToken: taddr,
      sellAmount: amount,
    };
    const response = await fetch(
      zeroxapi + `/swap/v1/price?${qs.stringify(params)}`
    );
    const sources = await fetch(
      zeroxapi + `/swap/v1/quote?${qs.stringify(params)}`
    );
    var swapPriceJSON = await response.json();
    var swapOrders = await sources.json();
    try {
      await swapOrders.orders.find((item) => {
        document.getElementById("defisource").innerHTML = item.source;
      });
    } catch (error) {
      document.getElementById("defisource").innerHTML = "Pool Not Available";
    }
    var rawvalue = swapOrders.buyAmount / 10 ** tdec;
    var value = rawvalue.toFixed(2);
    document.getElementById("to_amount").innerHTML = value;
    document.getElementById("gas_estimate").innerHTML =
      swapPriceJSON.estimatedGas;
  }

  async function swapit() {
    if (!faddr || !taddr || !document.getElementById("from_amount").value)
      return;
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    web3 = new Web3(connection);
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const userWallet = await signer.getAddress();
    let amount = Number(
      document.getElementById("from_amount").value * 10 ** fdec
    );
    const params = {
      sellToken: faddr,
      buyToken: taddr,
      sellAmount: amount,
    };
    const fromTokenAddress = faddr;
    const getquote = await fetch(
      zeroxapi + `/swap/v1/quote?${qs.stringify(params)}`
    );
    var quote = await getquote.json();
    var proxy = quote.allowanceTarget;
    var amountstr = amount.toString();
    const ERC20Contract = new ethers.Contract(fromTokenAddress, Erc20, signer);
    const approval = await ERC20Contract.approve(proxy, amountstr);
    await approval.wait();
    const txParams = {
      ...quote,
      from: userWallet,
      to: quote.to,
      value: quote.value.toString(16),
      gasPrice: null,
      gas: quote.gas,
    };
    await ethereum.request({
      method: "eth_sendTransaction",
      params: [txParams],
    });
    console.log(ethereum);
    closeHandler();
  }
  async function onSwap(e) {
    console.log(e.currentTarget.className);
    console.log(e.currentTarget.title);
    const name = e.currentTarget.title
    var i;
    const tabcontent = document.getElementsByClassName("tabcontent")
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(name).style.display = "block";
    e.currentTarget.className += " active";
  }

  return (
    <div gap={1} className="container">
      <div className="tuyem">
        <div className="aroundBotton">
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <img src="logo.png" width={"50%"} />
          </div>
          <div className="buttonConnect">
            <Button
              rounded
              color="primary"
              onPress={modalWallet}
              className="btn-connect"
              style={{ maxWidth: "200px" }}
            >
              <Text
                css={{ color: "white" }}
                size={16}
                weight="bold"
                transform="uppercase"
                id="status"
              >
                Connect to a wallet
              </Text>
            </Button>
          </div>
          <Modal
            scroll
            closeButton
            blur
            aria-labelledby="connect_modal"
            onClose={closeHandler}
            open={walletConnect}
          >
            {" "}
            <Modal.Header>
              <div
                style={{
                  fontSize: "25px",
                  fontFamily: "SF Pro Display",
                  fontWeight: "$bold",
                }}
              >
                Select a Wallet
              </div>
            </Modal.Header>
            <Modal.Body>
              <div onClick={connect}>
                <Text
                  size="$3xl"
                  css={{
                    fontFamily: "SF Pro Display",
                    textShadow: "0px 0px 1px #000000",
                    fontWeight: "400",
                    color: "white",
                    ml: "$10",
                    fontSize: "17px",
                    paddingRight: "5px",
                    borderRadius: "8px",
                    padding: "6px 10px 0px 10px",
                    marginTop: "6px",
                    height: "45px",
                    maxWidth: "100%",
                    background: "#363636",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#363636",
                    marginLeft: "0px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>MetaMask</span>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <img src={"metamask.png"} style={{ width: "40px" }} />
                  </div>
                </Text>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button auto flat color="primary" onPress={onDisconnect}>
                Log Out
              </Button>
              <Button auto flat color="error" onClick={closeHandler}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
        <Row justify="center">
          <Text
            h3={true}
            color="white"
            css={{
              justifyContent: "center",
              textRendering: "geometricPrecision",
              fontFamily: "SF Pro Display",
              fontWeight: "$bold",
              m: "$0",
              fontSize: "50px",
              display: "block",
            }}
          >
            HotPot Swap
          </Text>
        </Row>
        <div
          style={{
            marginBottom: "20px",
            justifyContent: "center",
            display: "flex",
            textRendering: "geometricPrecision",
            fontFamily: "SF Pro Display",
            fontWeight: "$bold",
            textShadow: "0px 0px 1px #000000",
          }}
        >
          <span>Exchange token in seconds</span>
        </div>
        <Modal
          scroll
          closeButton
          blur
          aria-labelledby="connect_modal"
          onClose={closeHandler}
          open={alert}
        >
          {" "}
          Please Connect Wallet
          <Modal.Footer>
            <Button auto flat color="primary" onClick={connect}>
              Connect Wallet
            </Button>
            <Button auto flat color="error" onClick={closeHandler}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        <div className="module headshot glow">
          <div
            style={{
              marginBottom: "15px",
              fontSize: "30px",
              textRendering: "geometricPrecision",
              fontFamily: "SF Pro Display",
              textShadow: "0px 0px 1px #000000",
            }}
          >
            <input class="radio" id="tab1" name="groups" type="radio" checked />
            <input class="radio" id="tab2" name="groups" type="radio" />
            <div className="tabs tablist">
              <div
                style={{
                  display: "flex",
                  background: "#16181A",
                  borderRadius: "8px",
                  maxWidth: "250px",
                }}
              >
                <label title="support" for="tab1" className="tablinks active"  onClick={onSwap}>
                  Swap
                </label>
                <label title="hotline" for="tab2" className="tablinks"  onClick={onSwap}>
                  Liquidity
                </label>
              </div>
            </div>
            <div class="panels">
              <div class="tabcontent" id="support">
                <div>
                  <div>
                    <div>
                      <div justify="center">
                        <div className="aroundGrid">
                          <div>
                            <div>
                              <Card
                                variant="bordered"
                                css={{
                                  color: "white",
                                  opacity: "80%",
                                  fontFamily: "SF Pro Display",
                                  fontWeight: "300",
                                  fontSize: "30px",
                                  textShadow: "0px 0px 2px #000000",
                                  boxShadow: "0px 0px 4px #80282880",
                                  height: "60px",
                                }}
                              >
                                <div>
                                  <Input
                                    type="text"
                                    size="$3xl"
                                    css={{
                                      fontFamily: "SF Pro Display",
                                      color: "white",
                                    }}
                                    className="number"
                                    color="default"
                                    placeholder="amount"
                                    id="from_amount"
                                    onChange={(e) => setHold(e.target.value)}
                                  />
                                </div>
                              </Card>
                            </div>
                            <div
                              style={{
                                position: "absolute",
                                right: "7px",
                                top: "3px",
                              }}
                            >
                              <a onClick={fromHandler}>
                                <Text
                                  size="$3xl"
                                  css={{
                                    fontFamily: "SF Pro Display",
                                    textShadow: "0px 0px 1px #000000",
                                    fontWeight: "400",
                                    color: "white",
                                    ml: "$10",
                                    fontSize: "17px",
                                    background: "#363636",
                                    paddingRight: "5px",
                                    borderRadius: "30px",
                                    padding: "6px 10px 0px 10px",
                                    marginTop: "6px",
                                    height: "45px",
                                  }}
                                >
                                  <img src={flogo} style={{ width: "20px" }} />
                                  <span style={{ fontSize: "20px" }}>
                                    {" " + fname}
                                  </span>
                                </Text>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Modal
                      scroll
                      closeButton
                      blur
                      aria-labelledby="token_modal"
                      onClose={closeHandler}
                      open={visible}
                    >
                      <Modal.Body>
                        <Input
                          type="text"
                          size="$3xl"
                          css={{ fontFamily: "SF Pro Display", color: "white" }}
                          className="number"
                          color="default"
                          placeholder="Paste Token Address"
                        />
                        <Text size={16}>Or Choose Below:</Text>
                        <div id="token_list"></div>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button auto flat color="error" onClick={closeHandler}>
                          Close
                        </Button>
                      </Modal.Footer>
                    </Modal>
                    <div>
                      <Row>
                        <Text
                          css={{
                            marginLeft: "$3",
                            fontSize: "$lg",
                            fontFamily: "SF Pro Display",
                          }}
                        >
                          Balance:
                        </Text>
                        <Text
                          css={{
                            marginLeft: "$3",
                            fontSize: "$lg",
                            fontFamily: "SF Pro Display",
                            color: "#39FF14",
                          }}
                          id="get_balance"
                        ></Text>
                      </Row>
                    </div>
                    <Row justify="center">
                      <img src="arrow.png" width={"3%"} />
                    </Row>
                    <div className="22222">
                      <div justify="center">
                        <div
                          className="aroundSwapTo"
                          style={{
                            display: "flex",
                            position: "relative",
                          }}
                        >
                          <div>
                            <Card
                              variant="bordered"
                              style={{
                                height: "58px",
                                width: "532px",
                              }}
                              css={{
                                color: "white",
                                opacity: "80%",
                                fontFamily: "SF Pro Display",
                                fontWeight: "300",
                                fontSize: "30px",
                                textShadow: "0px 0px 2px #000000",
                                boxShadow: "0px 0px 4px #80282880",
                                height: "60px",
                              }}
                            >
                              <Col>
                                <Text
                                  type="text"
                                  size="$4xl"
                                  css={{
                                    fontFamily: "SF Pro Display",
                                    color: "white",
                                    textShadow: "0px 0px 3px #39FF14",
                                    ml: "$2",
                                  }}
                                  className="number"
                                  color="default"
                                  id="to_amount"
                                />
                              </Col>
                            </Card>
                          </div>
                          <Spacer />
                          <div className="buttonSwapTo">
                            <a onClick={toHandler}>
                              <Text
                                size="$3xl"
                                css={{
                                  fontFamily: "SF Pro Display",
                                  textShadow: "0px 0px 1px #000000",
                                  fontWeight: "400",
                                  color: "white",
                                  ml: "$10",
                                  fontSize: "15px",
                                  background: "#363636",
                                  paddingRight: "5px",
                                  borderRadius: "30px",
                                  padding: "4px 18px 0px 18px",
                                  marginTop: "5px",
                                  height: "45px",
                                }}
                              >
                                <img src={tlogo} style={{ width: "20px" }} />
                                <span style={{ fontSize: "20px" }}>
                                  {" " + tname}
                                </span>
                              </Text>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        marginTop: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-around",
                        }}
                      >
                        <div>
                          <Row>
                            <Text
                              size={20}
                              css={{
                                marginLeft: "$5",
                                color: "white",
                                fontFamily: "SF Pro Display",
                                fontSize: "20px",
                              }}
                            >
                              Gas Estimate:{" "}
                            </Text>
                            <p
                              style={{
                                fontFamily: "SF Pro Display",
                                fontSize: "20px",
                                marginLeft: "4px",
                                color: "#39FF14",
                                fontWeight: "bold",
                                textShadow: "0px 0px 1px #000000",
                              }}
                              id="gas_estimate"
                            ></p>
                          </Row>
                        </div>
                        <div>
                          <Row>
                            <Text
                              size={24}
                              css={{
                                marginLeft: "$5",
                                color: "white",
                                fontFamily: "SF Pro Display",
                                fontSize: "20px",
                              }}
                            >
                              LP Provider:{" "}
                            </Text>
                            <p
                              style={{
                                fontFamily: "SF Pro Display",
                                fontSize: "20px",
                                marginLeft: "4px",
                                color: "#39FF14",
                                fontWeight: "bold",
                                textShadow: "0px 0px 1px #000000",
                              }}
                              id="defisource"
                            ></p>
                          </Row>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <Card
                        isPressable
                        className="btn-grad"
                        onPress={swapToken}
                        style={{
                          margin: "0 auto",
                          maxWidth: "165px",
                        }}
                      >
                        <Text
                          css={{
                            display: "flex",
                            justifyContent: "center",
                            textShadow: "0px 0px 2px #000000",
                            disable: "disable",
                          }}
                          size="$3xl"
                          weight="bold"
                          transform="uppercase"
                        >
                          SWAP !
                        </Text>
                      </Card>
                      <Modal
                        scroll
                        closeButton
                        blur
                        aria-labelledby="connect_modal"
                        onClose={closeHandler}
                        open={swap}
                      >
                        <Modal.Header>
                          <div
                            style={{
                              fontSize: "25px",
                              fontFamily: "SF Pro Display",
                              fontWeight: "$bold",
                            }}
                          >
                            Confirm Swap
                          </div>
                        </Modal.Header>
                        <Modal.Body>
                          <div>
                            <div
                              style={{
                                marginBottom: "30px",
                                justifyContent: "space-between",
                              }}
                            >
                              <div>
                                <Text
                                  size="$3xl"
                                  css={{
                                    fontFamily: "SF Pro Display",
                                    textShadow: "0px 0px 1px #000000",
                                    fontWeight: "400",
                                    color: "white",
                                    ml: "$10",
                                    fontSize: "17px",
                                    paddingRight: "5px",
                                    borderRadius: "30px",
                                    padding: "6px 10px 0px 10px",
                                    marginTop: "6px",
                                    height: "45px",
                                    maxWidth: "100%",
                                    background: "#363636",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "#363636",
                                    marginLeft: "0px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <img
                                      src={flogo}
                                      style={{ width: "30px" }}
                                    />
                                    <Text
                                      type="text"
                                      size="15px"
                                      css={{
                                        fontFamily: "SF Pro Display",
                                        color: "white",
                                        textShadow: "0px 0px 3px #39FF14",
                                        ml: "$2",
                                      }}
                                      className="number"
                                      color="default"
                                      id="sell_value"
                                    />
                                  </div>
                                  <span style={{ fontSize: "20px" }}>
                                    {" " + fname}
                                  </span>
                                </Text>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  margin: "5px 0px",
                                }}
                              >
                                <img
                                  src={"anh.png"}
                                  style={{ width: "30px" }}
                                />
                              </div>
                              <div>
                                <Text
                                  size="$3xl"
                                  css={{
                                    fontFamily: "SF Pro Display",
                                    textShadow: "0px 0px 1px #000000",
                                    fontWeight: "400",
                                    color: "white",
                                    ml: "$10",
                                    fontSize: "15px",
                                    paddingRight: "5px",
                                    borderRadius: "30px",
                                    padding: "4px 10px 0px 10px",
                                    marginTop: "5px",
                                    height: "45px",
                                    maxWidth: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: "#363636",
                                    marginLeft: "0px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <img
                                      src={tlogo}
                                      style={{ width: "30px" }}
                                    />
                                    <Text
                                      type="text"
                                      size="15px"
                                      css={{
                                        fontFamily: "SF Pro Display",
                                        color: "white",
                                        textShadow: "0px 0px 3px #39FF14",
                                        ml: "$2",
                                      }}
                                      className="number"
                                      color="default"
                                      id="raw"
                                    />
                                  </div>
                                  <span style={{ fontSize: "20px" }}>
                                    {" " + tname}
                                  </span>
                                </Text>
                              </div>
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  size={20}
                                  css={{ marginLeft: "$5" }}
                                  style={{
                                    fontSize: "15px",
                                    fontFamily: "SF Pro Display",
                                    fontWeight: "bold",
                                    color: "#808080",
                                  }}
                                >
                                  Route:{" "}
                                </span>
                                <div style={{ display: "flex" }}>
                                  <p
                                    style={{
                                      fontFamily: "SF Pro Display",
                                      fontSize: "15px",
                                      marginLeft: "4px",
                                      color: "white",
                                      textShadow: "0px 0px 1px #000000",
                                    }}
                                    id=""
                                  >
                                    {fname}
                                  </p>
                                  <p
                                    style={{
                                      fontFamily: "SF Pro Display",
                                      fontSize: "15px",
                                      marginLeft: "4px",
                                      color: "white",
                                      textShadow: "0px 0px 1px #000000",
                                    }}
                                    id=""
                                  >
                                    {">"}
                                  </p>
                                  <p
                                    style={{
                                      fontFamily: "SF Pro Display",
                                      fontSize: "15px",
                                      marginLeft: "4px",
                                      color: "white",
                                      textShadow: "0px 0px 1px #000000",
                                    }}
                                    id=""
                                  >
                                    {tname}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  size={20}
                                  css={{ marginLeft: "$5" }}
                                  style={{
                                    fontSize: "15px",
                                    fontFamily: "SF Pro Display",
                                    fontWeight: "bold",
                                    color: "#808080",
                                  }}
                                >
                                  Minimum reveived:{" "}
                                </span>
                                <Text
                                  type="text"
                                  size="15px"
                                  css={{
                                    fontFamily: "SF Pro Display",
                                    color: "white",
                                    textShadow: "0px 0px 3px #39FF14",
                                    ml: "$2",
                                  }}
                                  className="number"
                                  color="default"
                                  id="minimum_reveived"
                                />
                              </div>
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  size={20}
                                  css={{ marginLeft: "$5" }}
                                  style={{
                                    fontSize: "15px",
                                    fontFamily: "SF Pro Display",
                                    fontWeight: "bold",
                                    color: "#808080",
                                  }}
                                >
                                  Gas Estimate:{" "}
                                </span>
                                <p
                                  style={{
                                    fontFamily: "SF Pro Display",
                                    fontSize: "15px",
                                    marginLeft: "4px",
                                    color: "white",
                                    textShadow: "0px 0px 1px #000000",
                                  }}
                                  id="estimate_gas"
                                ></p>
                              </div>
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  size={24}
                                  css={{ marginLeft: "$5", color: "white" }}
                                  style={{
                                    fontSize: "15px",
                                    fontFamily: "SF Pro Display",
                                    fontWeight: "bold",
                                    color: "#808080",
                                  }}
                                >
                                  LP Provider:
                                </span>
                                <p
                                  style={{
                                    fontFamily: "SF Pro Display",
                                    fontSize: "15px",
                                    marginLeft: "4px",
                                    color: "white",
                                    textShadow: "0px 0px 1px #000000",
                                  }}
                                  id="liquid_provider"
                                ></p>
                              </div>
                            </div>
                          </div>
                        </Modal.Body>
                        <Modal.Footer>
                          <Card
                            isPressable
                            className="btn-grad"
                            onPress={swapit}
                            style={{
                              margin: "0 auto",
                              maxWidth: "100%",
                              height: "45px",
                            }}
                          >
                            <Text
                              css={{
                                display: "flex",
                                justifyContent: "center",
                                textShadow: "0px 0px 2px #000000",
                              }}
                              size="22px"
                              weight="bold"
                            >
                              Confirm Swap
                            </Text>
                          </Card>
                        </Modal.Footer>
                      </Modal>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tabcontent" id="hotline">
                <div class="add_liquidity box-cskh bgfff pad16 row mb-8" style={{position:"relative"}} >
                  <div className="aroundGrid" style={{marginBottom:"25px",}} >
                    <div>
                      <div>
                        <Card
                          variant="bordered"
                          css={{
                            color: "white",
                            opacity: "80%",
                            fontFamily: "SF Pro Display",
                            fontWeight: "300",
                            fontSize: "30px",
                            textShadow: "0px 0px 2px #000000",
                            boxShadow: "0px 0px 4px #80282880",
                            height: "60px",
                          }}
                        >
                          <div>
                            <Input
                              type="text"
                              size="$3xl"
                              css={{
                                fontFamily: "SF Pro Display",
                                color: "white",
                              }}
                              className="number"
                              color="default"
                              placeholder="amount"
                              id="from_amount"
                              onChange={(e) => setHold(e.target.value)}
                            />
                          </div>
                        </Card>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          right: "7px",
                          top: "3px",
                        }}
                      >
                        <a onClick={modalWallet}>
                          <Text
                            size="$3xl"
                            css={{
                              fontFamily: "SF Pro Display",
                              textShadow: "0px 0px 1px #000000",
                              fontWeight: "400",
                              color: "white",
                              ml: "$10",
                              fontSize: "17px",
                              background: "#363636",
                              paddingRight: "5px",
                              borderRadius: "30px",
                              padding: "6px 10px 0px 10px",
                              marginTop: "6px",
                              height: "45px",
                            }}
                          >
                            <img src={flogo} style={{ width: "20px" }} />
                            <span style={{ fontSize: "20px" }}>
                              {" " + fname}
                            </span>
                          </Text>
                        </a>
                      </div>
                    </div>
                  <div className="img_pluss" style={{position:"absolute",top:"50px", right:"30px" }}>
                    <img src="pluss.png" alt="" width={"40px"} style={{ background: "rgb(22, 24, 26)", borderRadius:"50%"}} />
                  </div>
                  </div>
                  <div className="aroundGrid">
                    <div>
                      <div>
                        <Card
                          variant="bordered"
                          css={{
                            color: "white",
                            opacity: "80%",
                            fontFamily: "SF Pro Display",
                            fontWeight: "300",
                            fontSize: "30px",
                            textShadow: "0px 0px 2px #000000",
                            boxShadow: "0px 0px 4px #80282880",
                            height: "60px",
                          }}
                        >
                          <div>
                            <Input
                              type="text"
                              size="$3xl"
                              css={{
                                fontFamily: "SF Pro Display",
                                color: "white",
                              }}
                              className="number"
                              color="default"
                              placeholder="amount"
                              id="from_amount"
                              onChange={(e) => setHold(e.target.value)}
                            />
                          </div>
                        </Card>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          right: "7px",
                          top: "3px",
                        }}
                      >
                        <a onClick={fromHandler}>
                          <Text
                            size="$3xl"
                            css={{
                              fontFamily: "SF Pro Display",
                              textShadow: "0px 0px 1px #000000",
                              fontWeight: "400",
                              color: "white",
                              ml: "$10",
                              fontSize: "17px",
                              background: "#363636",
                              paddingRight: "5px",
                              borderRadius: "30px",
                              padding: "6px 10px 0px 10px",
                              marginTop: "6px",
                              height: "45px",
                            }}
                          >
                            <img src={flogo} style={{ width: "20px" }} />
                            <span style={{ fontSize: "20px" }}>
                              {" " + fname}
                            </span>
                          </Text>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
