"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import Image from "next/image";

const LANGUAGE_CONFIG = {
  javascript: { pistonRuntime: { language: "javascript", version: "18.15.0" } },
  typescript: { pistonRuntime: { language: "typescript", version: "5.0.3" } },
  python: { pistonRuntime: { language: "python", version: "3.10.0" } },
  java: { pistonRuntime: { language: "java", version: "15.0.2" } },
  go: { pistonRuntime: { language: "go", version: "1.16.2" } },
  rust: { pistonRuntime: { language: "rust", version: "1.68.2" } },
  cpp: { pistonRuntime: { language: "cpp", version: "10.2.0" } },
  csharp: { pistonRuntime: { language: "csharp", version: "6.12.0" } },
  ruby: { pistonRuntime: { language: "ruby", version: "3.0.1" } },
  swift: { pistonRuntime: { language: "swift", version: "5.3.3" } },
};

export default function CodeEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filename = searchParams.get("filename") || "Untitled";
  const language = searchParams.get("language") || "javascript";

  const [code, setCode] = useState("// Start coding here...");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const userId = 1743417824736; // Replace with dynamic value from session/cookie if needed

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const res = await fetch(`http://localhost:3001/files?filename=${filename}&language=${language}&userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch file data");

        const data = await res.json();
        const file = data.find((file: any) => file.filename === filename && file.language === language);
        if (file) {
          setCode(file.code || "");
          setFileId(file.id);
        }
      } catch (error) {
        console.error("Error fetching file:", error);
      }
    };

    fetchFile();
  }, [filename, language, userId]);

  useEffect(() => {
    if (!fileId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:3001/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) throw new Error("Failed to update file");
      } catch (error) {
        console.error("Error updating file:", error);
      }
    }, 1000);
  }, [code, fileId]);

  const getFileIcon = (lang: string) => {
    const availableIcons = ["cpp", "csharp", "go", "java", "javascript", "python", "ruby", "rust", "swift", "typescript"];
    return availableIcons.includes(lang.toLowerCase()) ? `/${lang.toLowerCase()}.png` : "/default.png";
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput((prev) => [...prev, "> Running..."]);

    try {
      const runtime = LANGUAGE_CONFIG[language as keyof typeof LANGUAGE_CONFIG]?.pistonRuntime;
      if (!runtime) throw new Error("Unsupported language.");

      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ content: code }],
          stdin: input,
        }),
      });

      if (!response.ok) throw new Error("Execution API error");

      const result = await response.json();
      setOutput((prev) => [
        ...prev.slice(0, -1),
        `> ${input}`,
        result.run.stdout || result.run.stderr || "No output",
      ]);
    } catch (error) {
      setOutput((prev) => [...prev, "Error executing code."]);
    } finally {
      setIsRunning(false);
      setInput("");
    }
  };

  return (
    <div className="flex flex-row items-start min-h-screen bg-gray-900 text-white p-8 relative gap-4">
      <div className="flex flex-col w-2/3">
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl shadow-lg animate-fade-in">
          <div className="flex items-center">
            <Image src={getFileIcon(language)} alt={language} width={40} height={40} className="mr-3" />
            <h1 className="text-xl font-bold text-gray-200">
              {filename}.{language}
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRunCode} disabled={isRunning} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all disabled:bg-gray-600">
              {isRunning ? "Running..." : "Run Code"}
            </button>
            <button onClick={() => router.push("/user")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
              ← Back to Files
            </button>
          </div>
        </div>

        <div className="w-full mt-4 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
          <Editor
            height="70vh"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{
              fontSize: 16,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      <div className="w-1/3 bg-black text-white rounded-lg shadow-lg border border-gray-700 flex flex-col p-4 font-mono animate-fade-in">
        <h2 className="text-lg font-bold text-gray-300">Terminal</h2>
        <div className="h-64 overflow-y-auto p-2 text-sm border-b border-gray-600">
          {output.map((line, index) => (
            <p key={index} className="whitespace-pre-wrap text-green-400">{line}</p>
          ))}
        </div>
        <div className="flex items-center mt-2">
          <span className="text-blue-400">$</span>
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:outline-none p-2 text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRunCode()}
            placeholder="Type input and press Enter..."
          />
        </div>
      </div>
    </div>
  );
}
