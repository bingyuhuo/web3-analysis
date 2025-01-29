"use client";

import { useState, useRef, useEffect } from "react";
import { useAppKit } from "@/context";
import type { AppKit } from "@/types/app";
import { UserCredits } from "@/types/user";
import { useDisconnect, useAccount } from "wagmi";
import Link from "next/link";
import WalletModal from "../wallet-modal/index";

export default function WalletConnect() {
  const appKit = useAppKit() as unknown as AppKit;
  const { address, isConnected } = useAccount();
  const [showDropdown, setShowDropdown] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 添加状态变化的日志
  useEffect(() => {
    console.log('Wallet connection status:', { isConnected, address });
  }, [isConnected, address]);

  useEffect(() => {
    setMounted(true);
    console.log('Component mounted');
  }, []);

  // 获取用户积分
  useEffect(() => {
    if (isConnected && address) {
      console.log('Fetching user credits for address:', address);
      fetchUserCredits();
      checkExpiring();
    }
  }, [isConnected, address]);

  // 添加用户信息同步
  useEffect(() => {
    const syncUserInfo = async () => {
      if (isConnected && address) {
        try {
          const res = await fetch("/api/get-user-info", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ address }),
          });
          // 同步完用户信息后获取积分
          fetchUserCredits();
        } catch (error) {
          console.error("同步用户信息失败:", error);
        }
      }
    };

    syncUserInfo();
  }, [isConnected, address]);

  const fetchUserCredits = async () => {
    if (!address) return;
    try {
      const res = await fetch("/api/get-user-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });
      const { data } = await res.json();
      console.log('User credits fetched:', data);
      setCredits(data);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  const checkExpiring = async () => {
    if (!address) return;
    try {
      const expiringInfo = await fetch("/api/check-expiring-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      }).then((res) => res.json());

      if (expiringInfo.data?.isExpiring) {
        alert(
          `remind:you have ${expiringInfo.data.credits} points that will expire in ${expiringInfo.data.daysLeft} days`
        );
      }
    } catch (error) {
      console.error("Failed to check expiring credits:", error);
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = () => {
    console.log('Opening wallet modal...');
    setShowWalletModal(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      await appKit.close();
      // 清除本地存储
      localStorage.removeItem("wagmi.wallet");
      localStorage.removeItem("wagmi.connected");
      localStorage.removeItem("wagmi.account");
      // 关闭下拉菜单
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect, please try again");
    }
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "Not connected";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 确保正确计算可用积分
  const availableCredits =
    credits?.left_credits || 0 - (credits?.used_credits || 0);

  // 只在客户端渲染时显示内容
  if (!mounted) {
    return (
      <button className="rounded-lg px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="rounded-lg px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="rounded-lg px-6 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300"
          >
            {formatAddress(address)}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl glass-effect border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Wallet Address</p>
                  <p className="font-mono text-sm text-white truncate">
                    {address}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Available Credits</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {credits?.left_credits || 0}
                  </p>
                </div>

                <Link
                  href={`/my-reports/${address}`}
                  className="block w-full text-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm text-white hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                >
                  My Reports
                </Link>

                <button
                  onClick={handleDisconnect}
                  className="w-full rounded-lg bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm text-white hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
}
