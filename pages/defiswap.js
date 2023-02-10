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
import Swal from "sweetalert2";

export default function Defiswap() {
  const { visible, setVisible } = useModal();
  const [flogo, getFromLogo] = useState([]);
  const [flogoliquid, getFromLogoLiquid] = useState([]);
  const [tlogoliquid, getToLogoLiquid] = useState([]);
  const [fname, getFromName] = useState(["Swap From"]);
  const [fnameliquid, getFromNameLiquid] = useState(["Select Token"]);
  const [tnameliquid, getToNameLiquid] = useState(["Select Token"]);
  const [faddr, getFromAddr] = useState([]);
  const [faddrliquid, getFromAddrLiquid] = useState([]);
  const [taddrliquid, getToAddrLiquid] = useState([]);
  const [fdec, getFromDec] = useState([]);
  const [fdecliquid, getFromDecLiquid] = useState([]);
  const [tdecliquid, getToDecLiquid] = useState([]);
  const [tlogo, getToLogo] = useState([]);
  const [tname, getToName] = useState(["Swap To"]);
  const [taddr, getToAddr] = useState([]);
  const [tdec, getToDec] = useState([]);
  const [holdup, setHold] = useState("");
  const [valueup, setValue] = useState("");
  const [wallet, getWallet] = useState([]);
  const [alert, setAlert] = useState(false);
  const [swap, setSwap] = useState(false);
  const [modalLiquid, setModalLiquid] = useState(false);
  const [errorSelectToken, setErrorSelectToken] = useState(false);
  const [walletConnect, setWalletConnect] = useState(false);
  const [price, setPrice] = useState([]);
  const [priceliquid, setPriceLiquid] = useState([]);
  const [priceliquidto, setPriceLiquidTo] = useState([]);
  const [orders, setOrder] = useState([]);
  const [ordersliquid, setOrderLiquid] = useState([]);
  const [ordersliquidto, setOrderLiquidTo] = useState([]);
  const [listLiquid, setListLiquid] = useState([
    { fName: "", fLogo: "", fValue: "", tName: "", tLogo: "", tValue: "" },
  ]);

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

  useEffect(() => {}, [
    getToLogoLiquid,
    getToNameLiquid,
    getToAddrLiquid,
    getToDecLiquid,
    setPriceLiquidTo,
    setOrderLiquidTo,
  ]);
  async function setLocal(){
    localStorage.setItem("data_liquid", JSON.stringify(listLiquid))
  }
  useEffect(() => {}, [setLocal()]);

  useEffect(() => {}, [getToLogo, getToName, getToAddr]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getPrice();
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [holdup]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getValue();
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [valueup]);

  let currentTrade = {};
  let currentSelectSide = null;
  let toTrade = {};
  let toSelectSide = null;

  const sendAlert = () => setAlert(true);
  const sendErrorSelect = () => setErrorSelectToken(true);

  const fromHandler = (side) => {
    if (wallet.includes("0x")) {
      setVisible(true);
      currentSelectSide = side;
      listFromTokens();
    } else {
      modalWallet();
    }
  };
  const fromHandlerLiquid = (side) => {
    if (wallet.includes("0x")) {
      setVisible(true);
      currentSelectSide = side;
      listFromLiquidTokens();
    } else {
      modalWallet();
    }
  };
  const fromHandlerLiquidTo = (side) => {
    if (wallet.includes("0x")) {
      setVisible(true);
      currentSelectSide = side;
      listToLiquidTokens();
    } else {
      modalWallet();
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
    setErrorSelectToken(false);
    setModalLiquid(false);
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
    const spanToLiquid = document.getElementById("get_balance").innerHTML;
    const spanFromLiquid = document.getElementById("get_balance").innerHTML;
    const spanToSplit = spanToLiquid.split(" ");
    const spanFromSplit = spanFromLiquid.split(" ");
    if (Number(spanToSplit[1]) && Number(spanFromSplit[1]) > 0) {
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
    } else errorBalance();
  }
  async function errorBalance() {
    Swal.fire({
      title: "No token balance",
      icon: "error",
      confirmButtonText: "Cool",
    });
  }
  async function approve() {
    const spanToLiquid = document.getElementById(
      "get_balance_to_liquid"
    ).innerHTML;
    const spanFromLiquid = document.getElementById(
      "get_balance_from_liquid"
    ).innerHTML;
    const spanToSplit = spanToLiquid.split(" ");
    const spanFromSplit = spanFromLiquid.split(" ");
    if (Number(spanToSplit[1]) && Number(spanFromSplit[1]) > 0) {
      setModalLiquid(true);
      const delayDebounce = setTimeout(() => {
        checkIt();
      }, 200);
    } else errorBalance();
  }

  async function checkIt() {
    const fromToken = document.getElementById("from_liquid").value;
    const toToken = document.getElementById("to_liquid").value;
    document.getElementById("fromToken").innerHTML = fromToken;
    document.getElementById("toToken").innerHTML = toToken;
    const per1 = toToken / fromToken;
    const per2 = fromToken / toToken;
    document.getElementById("toTokenLiquid").innerHTML = per1.toFixed(2);
    document.getElementById("fromTokenLiquid").innerHTML = per2.toFixed(2);
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
  async function listFromLiquidTokens() {
    let response = await fetch("http://localhost:3000/api/tokens");
    let tokenListJSON = await response.json();
    var tokens = tokenListJSON.tokens;
    let parent = document.getElementById("token_list");
    for (const i in tokens) {
      let div = document.createElement("div");
      div.className = "token_row";
      let html = `
          <img className="token_list_img" width="12%" src="${tokens[i].logoURI}">
            <span className="token_list_text" size="15px">${tokens[i].symbol}</span>
            `;
      div.innerHTML = html;
      div.onclick = () => {
        selectFromLiquid(tokens[i]);
      };
      parent.appendChild(div);
    }
  }
  async function listToLiquidTokens() {
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
        selectToLiquid(tokens[i]);
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
    displayBalance(fromAddr);
  }
  function selectFromLiquid(token) {
    currentTrade[currentSelectSide] = token;
    closeHandler();
    var fromName = token.name;
    var fromLogo = token.logoURI;
    var fromAddr = token.address;
    var fromDec = token.decimals;
    getFromAddrLiquid(fromAddr);
    getFromNameLiquid(fromName);
    getFromLogoLiquid(fromLogo);
    getFromDecLiquid(fromDec);
    displayBalanceFromLiquid(fromAddr);
  }
  function selectToLiquid(token) {
    currentTrade[currentSelectSide] = token;
    closeHandler();
    var fromName = token.name;
    var fromLogo = token.logoURI;
    var fromAddr = token.address;
    var fromDec = token.decimals;
    getToNameLiquid(fromName);
    getToLogoLiquid(fromLogo);
    getToAddrLiquid(fromAddr);
    getToDecLiquid(fromDec);
    displayBalanceToLiquid(fromAddr);
  }

  async function displayBalance(addr) {
    const tokenContractAddresses = [addr];
    const data = await alchemy.core.getTokenBalances(
      wallet,
      tokenContractAddresses
    );
    data.tokenBalances.find((item) => {
      let rawbalance = parseInt(item.tokenBalance, 16).toString();
      let formatbalance = Number(
        Web3.utils.fromWei(rawbalance) * 1000000000000
      );
      console.log(
        "huy:",
        Number(Web3.utils.fromWei(rawbalance)) * 1000000000000
      );
      let balance = formatbalance.toFixed(2);
      if (
        item.tokenBalance ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        document.getElementById("get_balance").innerHTML = "Balance: 0.00";
      } else {
        document.getElementById("get_balance").innerHTML =
          "Balance: " + balance;
      }
    });
  }

  async function displayBalanceFromLiquid(addr) {
    const tokenContractAddresses = [addr];
    const data = await alchemy.core.getTokenBalances(
      wallet,
      tokenContractAddresses
    );
    data.tokenBalances.find((item) => {
      let rawbalance = parseInt(item.tokenBalance, 16).toString();
      let formatbalance = Number(
        Web3.utils.fromWei(rawbalance) * 1000000000000
      );
      console.log("formatbalance1:", formatbalance);
      let balance = formatbalance.toFixed(2);
      if (
        item.tokenBalance ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        document.getElementById("get_balance_from_liquid").innerHTML =
          "Balance: 0.00";
      } else {
        document.getElementById("get_balance_from_liquid").innerHTML =
          "Balance: " + balance;
      }
    });
  }
  async function displayBalanceToLiquid(addr) {
    const tokenContractAddresses = [addr];
    const data = await alchemy.core.getTokenBalances(
      wallet,
      tokenContractAddresses
    );
    data.tokenBalances.find((item) => {
      let rawbalance = parseInt(item.tokenBalance, 16).toString();
      let formatbalance = Number(
        Web3.utils.fromWei(rawbalance) * 1000000000000
      );
      let balance = formatbalance.toFixed(2);
      if (
        item.tokenBalance ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        document.getElementById("get_balance_to_liquid").innerHTML =
          "Balance: 0.00";
      } else {
        document.getElementById("get_balance_to_liquid").innerHTML =
          "Balance: " + balance;
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
  }
  async function getValue() {
    console.log("Getting Value");
    const fromLiquid = document.getElementById("from_liquid").value;
    const toLiquid = document.getElementById("to_liquid").value;
    const per1 = toLiquid / fromLiquid;
    const per2 = fromLiquid / toLiquid;
    if (fromLiquid && toLiquid) {
      document.getElementById("to_from").innerHTML = per1.toFixed(2);
      document.getElementById("from_to").innerHTML = per2.toFixed(2);
      document.getElementById("fromPerTo").innerHTML = "100%";
    }
    console.log("from:", fromLiquid / toLiquid);
    console.log("to:", toLiquid);
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
    document.getElementById("to_amount").value = value;
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

  async function confirmAdding() {
    const data_liquid = localStorage.getItem("data_liquid")
    const valueTokenFrom = document.getElementById("from_liquid").value;
    const valueTokenTo = document.getElementById("to_liquid").value;
    const data = {
      fName: fnameliquid,
      fLogo: flogoliquid,
      fValue: valueTokenFrom,
      tName: tnameliquid,
      tLogo: tlogoliquid,
      tValue: valueTokenTo,
    };
    if (valueTokenTo && valueTokenFrom) {
      if (listLiquid.length != 0) {
        for (let i = 0; i < data_liquid.length; i++) {
          // const element = array[i];
          
          console.log(data_liquid);
          // const pushData = data_liquid.push.apply(data)
          const pushData = [{...data_liquid},data]
          console.log(pushData);
        }
      }
      // setListLiquid(data);
    }
    // const dataLiquid = JSON.stringify(data)
    // localStorage.setItem("data_liquid", dataLiquid)
  }

  async function onSwap(e) {
    const name = e.currentTarget.title;
    var i;
    const tabcontent = document.getElementsByClassName("tabcontent");
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
            onClick={sendErrorSelect}
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
        <Modal
          scroll
          closeButton
          blur
          aria-labelledby="connect_modal"
          onClose={closeHandler}
          open={errorSelectToken}
        >
          <Modal.Body></Modal.Body>
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
              marginBottom: "10px",
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
                  backgroundColor: "rgb(32, 34, 49)",
                  borderRadius: "8px",
                  maxWidth: "250px",
                }}
              >
                <label
                  title="support"
                  for="tab1"
                  className="tablinks active"
                  onClick={onSwap}
                >
                  Swap
                </label>
                <label
                  title="hotline"
                  for="tab2"
                  className="tablinks"
                  onClick={onSwap}
                >
                  Liquidity
                </label>
              </div>
            </div>
            <div class="panels">
              <div class="tabcontent" id="support">
                <div>
                  <div style={{ position: "relative" }}>
                    <div>
                      <div justify="center">
                        <div
                          className="aroundGrid"
                          style={{ marginBottom: "40px" }}
                        >
                          <div className="buttonSelect">
                            <a onClick={fromHandler}>
                              <div>
                                <img src={flogo} style={{ width: "20px" }} />
                                <span
                                  style={{ fontSize: "20px", color: "#BFBFBF" }}
                                >
                                  {" " + fname}
                                </span>
                              </div>
                            </a>
                          </div>
                          <div className="inputSelect">
                            <div>
                              <input
                                type="text"
                                className="insildeInputSelect"
                                placeholder="amount"
                                id="from_amount"
                                onChange={(e) => setHold(e.target.value)}
                              />
                            </div>
                            <div className="balance">
                              <div
                                style={{
                                  marginLeft: "10px",
                                  fontSize: "13px",
                                  fontFamily: "SF Pro Display",
                                  color: "#BFBFBF",
                                  position: "absolute",
                                  right: "24px",
                                  top: "35px",
                                }}
                              >
                                <span
                                  style={{
                                    marginLeft: "$3",
                                    fontFamily: "SF Pro Display",
                                  }}
                                  id="get_balance"
                                ></span>
                              </div>
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

                    <div className="img_pluss">
                      <img
                        src="Muiten.png"
                        alt=""
                        style={{ maxWidth: "30px" }}
                      />
                    </div>
                    <div className="aroundGrid">
                      <div className="buttonSelect">
                        <a onClick={toHandler}>
                          <div>
                            <img src={tlogo} style={{ width: "20px" }} />
                            <span
                              style={{ fontSize: "20px", color: "#BFBFBF" }}
                            >
                              {" " + tname}
                            </span>
                          </div>
                        </a>
                      </div>
                      <div className="inputSelect">
                        <div>
                          <input
                            type="text"
                            className="insildeInputSelect"
                            id="to_amount"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        marginTop: "20px",
                        backgroundColor: "rgb(22, 21, 34)",
                        border: "7px solid rgb(32, 34, 49)",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        <Row className="Row">
                          <Text
                            size={20}
                            css={{
                              marginLeft: "$5",
                              fontFamily: "SF Pro Display",
                              fontSize: "15px",
                              color: "#BFBFBF",
                            }}
                          >
                            Gas Estimate:{" "}
                          </Text>
                          <p
                            style={{
                              fontFamily: "SF Pro Display",
                              fontSize: "15px",
                              marginLeft: "4px",
                              textShadow: "0px 0px 1px #000000",
                            }}
                            id="gas_estimate"
                          ></p>
                        </Row>
                      </div>
                      <div>
                        <Row className="Row">
                          <Text
                            size={24}
                            css={{
                              marginLeft: "$5",
                              fontFamily: "SF Pro Display",
                              fontSize: "15px",
                              color: "#BFBFBF",
                            }}
                          >
                            LP Provider:{" "}
                          </Text>
                          <p
                            style={{
                              fontFamily: "SF Pro Display",
                              fontSize: "15px",
                              marginLeft: "4px",
                              textShadow: "0px 0px 1px #000000",
                            }}
                            id="defisource"
                          ></p>
                        </Row>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "10px",
                      }}
                    >
                      <Card
                        isPressable
                        className="btn-grad"
                        onPress={swapToken}
                        style={{
                          margin: "0 auto",
                        }}
                      >
                        <Text
                          css={{
                            display: "flex",
                            justifyContent: "center",
                            textShadow: "0px 0px 2px #000000",
                            disable: "disable",
                          }}
                          size="25px"
                          weight="bold"
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
                <div
                  class="add_liquidity box-cskh bgfff pad16 row mb-8"
                  style={{ position: "relative" }}
                >
                  <div
                    className="aroundGridLiquid"
                    style={{ marginBottom: "40px" }}
                  >
                    <div className="buttonSelect">
                      <a onClick={fromHandlerLiquid}>
                        <div>
                          <img src={flogoliquid} style={{ width: "30px" }} />
                          <span style={{ fontSize: "20px", color: "#BFBFBF" }}>
                            {" " + fnameliquid}
                          </span>
                        </div>
                      </a>
                    </div>
                    <div className="inputSelect">
                      <div>
                        <input
                          type="text"
                          className="insildeInputSelect"
                          placeholder="0.0"
                          id="from_liquid"
                          onChange={(e) => setValue(e.target.value)}
                        />
                      </div>
                      <div className="balance">
                        <div
                          style={{
                            marginLeft: "10px",
                            fontSize: "13px",
                            fontFamily: "SF Pro Display",
                            color: "#BFBFBF",
                            position: "absolute",
                            right: "24px",
                            top: "35px",
                          }}
                        >
                          <span
                            style={{
                              marginLeft: "$3",
                              fontFamily: "SF Pro Display",
                            }}
                            id="get_balance_from_liquid"
                          ></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="img_pluss">
                    <img src="pluss.png" alt="" style={{ maxWidth: "30px" }} />
                  </div>
                  <div className="aroundGridToLiquid">
                    <div className="buttonSelect">
                      <a onClick={fromHandlerLiquidTo}>
                        <div>
                          <img src={tlogoliquid} style={{ width: "25px" }} />
                          <span style={{ fontSize: "20px", color: "#BFBFBF" }}>
                            {" " + tnameliquid}
                          </span>
                        </div>
                      </a>
                    </div>
                    <div className="inputSelect">
                      <div>
                        <input
                          type="text"
                          placeholder="0.0"
                          className="insildeInputSelect"
                          id="to_liquid"
                          onChange={(e) => setValue(e.target.value)}
                        />
                      </div>
                      <div className="balance">
                        <div
                          style={{
                            marginLeft: "10px",
                            fontSize: "13px",
                            fontFamily: "SF Pro Display",
                            color: "#BFBFBF",
                            position: "absolute",
                            right: "24px",
                            top: "35px",
                          }}
                        >
                          <span
                            style={{
                              marginLeft: "$3",
                              fontFamily: "SF Pro Display",
                            }}
                            id="get_balance_to_liquid"
                          ></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "20px",
                      backgroundColor: "rgb(22, 21, 34)",
                      border: "7px solid rgb(32, 34, 49)",
                      borderRadius: "8px",
                    }}
                  >
                    <div className="fromPerTo">
                      <div className="Row">
                        <div
                          style={{
                            marginLeft: "10px",
                            fontSize: "15px",
                            fontFamily: "SF Pro Display",
                            color: "#BFBFBF",
                          }}
                        >
                          <span id="to_from"></span>
                          {" " + tnameliquid} per {" " + fnameliquid}
                        </div>
                        <div
                          style={{
                            marginLeft: "$3",
                            fontSize: "15px",
                            fontFamily: "SF Pro Display",
                          }}
                          id="fromPerTo"
                        >
                          0%
                        </div>
                      </div>
                    </div>

                    <div className="toPerFrom">
                      <div className="Row">
                        <div
                          style={{
                            marginLeft: "10px",
                            fontSize: "15px",
                            fontFamily: "SF Pro Display",
                            color: "#BFBFBF",
                          }}
                        >
                          <span id="from_to"></span>
                          {" " + fnameliquid} per {" " + tnameliquid}
                        </div>
                        <div
                          style={{
                            marginLeft: "$3",
                            fontSize: "15px",
                            fontFamily: "SF Pro Display",
                          }}
                          id="fromPerTo"
                        >
                          Share of Pool
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    <Card
                      isPressable
                      className="btn-grad"
                      onPress={approve}
                      style={{
                        margin: "0 auto",
                      }}
                    >
                      <Text
                        id="hihi"
                        css={{
                          display: "flex",
                          justifyContent: "center",
                          textShadow: "0px 0px 2px #000000",
                        }}
                        size="$3xl"
                        weight="bold"
                      >
                        Approve !
                      </Text>
                    </Card>
                    <Modal
                      scroll
                      closeButton
                      blur
                      aria-labelledby="connect_modal"
                      onClose={closeHandler}
                      open={modalLiquid}
                    >
                      <Modal.Header>
                        <div
                          style={{
                            fontSize: "25px",
                            fontFamily: "SF Pro Display",
                            fontWeight: "$bold",
                          }}
                        >
                          Add Liquidity
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
                                    src={flogoliquid}
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
                                    id="fromToken"
                                  />
                                </div>
                                <span style={{ fontSize: "20px" }}>
                                  {" " + fnameliquid}
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
                              <img src={"plus.png"} style={{ width: "30px" }} />
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
                                    src={tlogoliquid}
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
                                    id="toToken"
                                  />
                                </div>
                                <span style={{ fontSize: "20px" }}>
                                  {" " + tnameliquid}
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
                                Adding:{" "}
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
                                  {fnameliquid}
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
                                  {"+"}
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
                                  {tnameliquid}
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
                                size={24}
                                css={{ marginLeft: "$5", color: "white" }}
                                style={{
                                  fontSize: "15px",
                                  fontFamily: "SF Pro Display",
                                  fontWeight: "bold",
                                  color: "#808080",
                                }}
                              >
                                {" " + fnameliquid} per {" " + tnameliquid}
                              </span>
                              <p
                                style={{
                                  fontFamily: "SF Pro Display",
                                  fontSize: "15px",
                                  marginLeft: "4px",
                                  color: "white",
                                  textShadow: "0px 0px 1px #000000",
                                }}
                                id="fromTokenLiquid"
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
                                {" " + tnameliquid} per {" " + fnameliquid}
                              </span>
                              <p
                                style={{
                                  fontFamily: "SF Pro Display",
                                  fontSize: "15px",
                                  marginLeft: "4px",
                                  color: "white",
                                  textShadow: "0px 0px 1px #000000",
                                }}
                                id="toTokenLiquid"
                              ></p>
                            </div>
                          </div>
                        </div>
                      </Modal.Body>
                      <Modal.Footer>
                        <Card
                          isPressable
                          className="btn-grad"
                          onPress={confirmAdding}
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
                            Confirm Adding Liquidity
                          </Text>
                        </Card>
                      </Modal.Footer>
                    </Modal>
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
