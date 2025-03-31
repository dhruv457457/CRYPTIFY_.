import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import MetaMaskSDK from "@metamask/sdk";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletData, setWalletData] = useState({ address: null, provider: null });

  const MMSDK = new MetaMaskSDK({
    dappMetadata: { name: "Cryptify" },
    logging: { developerMode: true },
  });

  useEffect(() => {
    const initializeProvider = async () => {
      try {
        const sdkProvider = MMSDK.getProvider();
        if (!sdkProvider) throw new Error("MetaMask SDK provider not initialized");
        const ethProvider = new ethers.BrowserProvider(sdkProvider);
        const accounts = await ethProvider.send("eth_accounts", []);
        if (accounts.length > 0) {
          setWalletData({ address: accounts[0], provider: ethProvider });
          const network = await ethProvider.getNetwork();
          if (network.chainId.toString() !== "59141") {
            console.warn("Connected to wrong network. Please switch to Linea Sepolia (59141).");
          }
        }
      } catch (err) {
        console.error("WalletProvider initialization failed:", err);
      }
    };
    initializeProvider();

    const sdkProvider = MMSDK.getProvider();
    if (sdkProvider && typeof sdkProvider.on === "function") {
      const handleChainChanged = (chainId) => {
        if (chainId !== "0xe4e5") { // Linea Sepolia in hex
          console.warn("Chain changed to incorrect network:", chainId);
        } else {
          console.log("Connected to Linea Sepolia");
        }
      };
      sdkProvider.on("chainChanged", handleChainChanged);
      return () => {
        if (sdkProvider && typeof sdkProvider.removeListener === "function") {
          sdkProvider.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  return (
    <WalletContext.Provider value={{ walletData, setWalletData }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
