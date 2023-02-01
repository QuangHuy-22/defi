import { NextUIProvider } from "@nextui-org/react";
import { createTheme } from "@nextui-org/react";
import Defiswap from "./defiswap";
import "../styles/style.css"

const darkTheme = createTheme({
  type: "dark",
});

function MyApp({ Component, pageProps }) {
  return (
    <NextUIProvider  theme={darkTheme}>
      {/* <Component {...pageProps} /> */}
      <Defiswap />
    </NextUIProvider>
  );
}

export default MyApp;
