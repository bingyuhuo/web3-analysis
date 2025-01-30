"use client";

import { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Report } from "@/types/report";  // 导入 Report 类型
import { useAppKitAccount } from '@reown/appkit/react'
import { UserCredits } from "@/types/user"
import SearchSuggestions from "@/components/search-suggestions/index"

interface Props {
  setReports: Dispatch<SetStateAction<Report[]>>;
}

export default function ({ setReports }: Props) {
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const { address, isConnected } = useAppKitAccount();
  const [credits, setCredits] = useState<UserCredits | null>(null);

  // 获取用户积分
  useEffect(() => {
    const fetchCredits = async () => {
      if (!address) return;
      try {
        const res = await fetch('/api/get-user-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        const { data } = await res.json();
        setCredits(data);
      } catch (error) {
        console.error('Get credits failed:', error);
      }
    };

    if (isConnected && address) {
      fetchCredits();
    }
  }, [isConnected, address]);

  const handleSubmit = async function () {
    if (submitting.current || loading) return;
    
    if (!projectName) {
      alert("Please enter the name of the Web3 project to be analyzed");
      return;
    }
  
    if (!isConnected || !address) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!credits || credits.left_credits < 10) {
      alert("Insufficient points, 10 points are required to generate a new report,please purchase points first!");
      return;
    }
  
    if (!confirm('Generating the analysis report will consume 10 points. Do you want to continue?')) {
      return;
    }
  
    submitting.current = true;
    setLoading(true);

    // 创建遮罩层和加载提示
    const overlay = document.createElement('div');
    const loadingMessage = document.createElement('div');
    
    try {
      // 设置遮罩层样式
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.zIndex = '9998';
      document.body.appendChild(overlay);

      // 设置加载提示样式
      loadingMessage.textContent = 'The report is being generated. It is expected to take 4 minutes.\nPlease do not switch pages or close the window....';
      loadingMessage.style.position = 'fixed';
      loadingMessage.style.top = '50%';
      loadingMessage.style.left = '50%';
      loadingMessage.style.transform = 'translate(-50%, -50%)';
      loadingMessage.style.padding = '20px';
      loadingMessage.style.backgroundColor = 'rgba(0,0,0,0.8)';
      loadingMessage.style.color = 'white';
      loadingMessage.style.borderRadius = '8px';
      loadingMessage.style.zIndex = '9999';
      document.body.appendChild(loadingMessage);

      // 设置超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 300000);
      });

      // 添加请求去重参数
      const requestId = `${address}-${projectName}-${Date.now()}`;
      
      const result = await Promise.race([
        fetch("/api/gen-reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId, // 添加请求唯一标识
          },
          body: JSON.stringify({
            projectName,
            address,
            requestId, // 在请求体中也包含请求ID
          }),
        }),
        timeoutPromise
      ]) as Response;

      const responseData = await result.json();
      console.log('Report generation response:', responseData);
      
      if (responseData.code === 0) {
        // 使用函数式更新来确保状态更新的准确性
        setReports(prev => {
          // 检查报告是否已经存在
          const reportExists = prev.some(report => report.id === responseData.data.id);
          if (reportExists) {
            return prev;
          }
          return [responseData.data, ...prev];
        });
        
        setProjectName("");
        setCredits(prev => ({
          ...prev!,
          left_credits: prev!.left_credits - 10
        }));
      } else {
        // 统一的错误码处理
        switch (responseData.code) {
          case -2:
            alert(responseData.message || "This item cannot be analyzed at the moment.");
            break;
          case -1:
            alert("Insufficient points, please purchase points first");
            break;
          case -3:
            alert("The request is too frequent, please wait 5 minutes and try again.");
            break;
          default:
            alert(responseData.message || "Failed to generate report.");
        }
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report,please try again later");
    } finally {
      // 清理工作
      if (loadingMessage.parentNode) document.body.removeChild(loadingMessage);
      if (overlay.parentNode) document.body.removeChild(overlay);
      setLoading(false);
      // 重置防重复提交标记
      submitting.current = false;
    }
  };

  const handleSelectReport = async (report: Report) => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    // 直接将报告添加到列表最前面
    setReports(reports => [report, ...reports.filter(r => r.id !== report.id)]);
    setProjectName(""); // 清空输入框
  };

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-row items-center gap-4">
      <Button 
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]" 
        onClick={handleSubmit} 
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Generate"}
      </Button>
      
      <div className="flex-1 relative">
        <Input
          type="text"
          placeholder="Please enter the name of the Web3 project to be analyzed"
          value={projectName || ""}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={loading}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
        />
        <SearchSuggestions 
          searchTerm={projectName}
          onSelect={handleSelectReport}
        />
      </div>
    </div>
  );
}
