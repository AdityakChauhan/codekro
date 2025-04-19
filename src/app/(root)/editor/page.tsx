// "use client";
// import { useState, useEffect, useRef } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Editor from "@monaco-editor/react";
// import Image from "next/image";
// import { GoogleGenAI } from "@google/genai";

// const LANGUAGE_CONFIG = {
//   javascript: { pistonRuntime: { language: "javascript", version: "18.15.0" } },
//   typescript: { pistonRuntime: { language: "typescript", version: "5.0.3" } },
//   python: { pistonRuntime: { language: "python", version: "3.10.0" } },
//   java: { pistonRuntime: { language: "java", version: "15.0.2" } },
//   go: { pistonRuntime: { language: "go", version: "1.16.2" } },
//   rust: { pistonRuntime: { language: "rust", version: "1.68.2" } },
//   cpp: { pistonRuntime: { language: "cpp", version: "10.2.0" } },
//   csharp: { pistonRuntime: { language: "csharp", version: "6.12.0" } },
//   ruby: { pistonRuntime: { language: "ruby", version: "3.0.1" } },
//   swift: { pistonRuntime: { language: "swift", version: "5.3.3" } },
// };

// const ai = new GoogleGenAI({
//   apiKey: process.env.NEXT_PUBLIC_PIYUSH_GOOGLE_GENAI_API_KEY!,
// });

// export default function CodeEditor() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const filename = searchParams.get("filename") || "Untitled";
//   const language = searchParams.get("language") || "javascript";

//   const [code, setCode] = useState("// Start coding here...");
//   const [input, setInput] = useState("");
//   const [output, setOutput] = useState<string[]>([]);
//   const [isRunning, setIsRunning] = useState(false);
//   const [isSuggesting, setIsSuggesting] = useState(false);
//   const [isCorrectingCode, setIsCorrectingCode] = useState(false);
//   const [fileId, setFileId] = useState<string | null>(null);
//   const [userId, setUserId] = useState<string | null>(null);
//   const debounceRef = useRef<NodeJS.Timeout | null>(null);

//   useEffect(() => {
//     const storedUserId = localStorage.getItem("userId");
//     if (!storedUserId) {
//       router.push("/login");
//     } else {
//       setUserId(storedUserId);
//     }
//   }, []);

//   useEffect(() => {
//     const fetchFile = async () => {
//       if (!userId) return;
//       try {
//         const res = await fetch(
//           `http://localhost:3001/files?filename=${filename}&language=${language}&userId=${userId}`
//         );
//         if (!res.ok) throw new Error("Failed to fetch file data");

//         const data = await res.json();
//         const file = data.find(
//           (f: any) =>
//             f.filename === filename && f.language === language
//         );
//         if (file) {
//           setCode(file.code || "");
//           setFileId(file.id);
//         }
//       } catch (err) {
//         console.error("Fetch file error:", err);
//       }
//     };

//     fetchFile();
//   }, [filename, language, userId]);

//   useEffect(() => {
//     if (!fileId) return;

//     if (debounceRef.current) clearTimeout(debounceRef.current);

//     debounceRef.current = setTimeout(async () => {
//       try {
//         await fetch(`http://localhost:3001/files/${fileId}`, {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ code }),
//         });
//       } catch (error) {
//         console.error("Failed to update file:", error);
//       }
//     }, 1000);
//   }, [code, fileId]);

//   const getFileIcon = (lang: string) => {
//     const available = [
//       "cpp", "csharp", "go", "java", "javascript",
//       "python", "ruby", "rust", "swift", "typescript",
//     ];
//     return available.includes(lang.toLowerCase())
//       ? `/${lang.toLowerCase()}.png`
//       : "/default.png";
//   };

//   const handleRunCode = async () => {
//     setIsRunning(true);
//     setOutput((prev) => [...prev, "> Running..."]);

//     try {
//       const runtime = LANGUAGE_CONFIG[language]?.pistonRuntime;
//       if (!runtime) throw new Error("Unsupported language.");

//       const response = await fetch("https://emkc.org/api/v2/piston/execute", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           language: runtime.language,
//           version: runtime.version,
//           files: [{ content: code }],
//           stdin: input,
//         }),
//       });

//       const result = await response.json();
//       setOutput((prev) => [
//         ...prev.slice(0, -1),
//         `> ${input}`,
//         result.run.stdout || result.run.stderr || "No output",
//       ]);
//     } catch (err) {
//       setOutput((prev) => [...prev, "Execution error"]);
//     } finally {
//       setIsRunning(false);
//       setInput("");
//     }
//   };

//   const handleSuggestCode = async () => {
//     setIsSuggesting(true);
//     try {
//       const result = await ai.models.generateContent({
//         model: "gemini-2.0-flash",
//         contents: `Suggest improvement or complete the following ${language} code. Comments should be in code only:\n\n${code}`,
//       });

//       const suggestion =
//         result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//       if (suggestion) {
//         const cropped = suggestion.substring(
//           3 + language.length,
//           suggestion.length - 4
//         );
//         setCode(cropped);
//       } else {
//         alert("No suggestion received.");
//       }
//     } catch (err) {
//       alert("Gemini API failed.");
//     } finally {
//       setIsSuggesting(false);
//     }
//   };

//   const handleCorrectCode = async () => {
//     setIsCorrectingCode(true);
//     setOutput((prev) => [...prev, "> Correcting code with AI..."]);
    
//     try {
//       const result = await ai.models.generateContent({
//         model: "gemini-2.0-flash",
//         contents: [
//           {
//             parts: [
//               {
//                 text: `Review and fix the following ${language} code. Identify and correct any errors, bugs, or issues. 
//                 Add detailed comments explaining what was fixed and why. 
//                 Only return the corrected code with explanatory comments. 
//                 Do not include any additional explanations outside of code comments.
                
//                 Here's the code to correct:
                
//                 ${code}`
//               }
//             ]
//           }
//         ]
//       });

//       const correctedCode = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//       if (correctedCode) {
//         // Extract just the code part (remove any markdown code blocks if present)
//         let processedCode = correctedCode;
//         if (processedCode.startsWith("```")) {
//           processedCode = processedCode.substring(
//             processedCode.indexOf("\n") + 1,
//             processedCode.lastIndexOf("```")
//           ).trim();
//         }
        
//         setCode(processedCode);
//         setOutput((prev) => [...prev.slice(0, -1), "> Code corrected with AI. Check comments for details."]);
//       } else {
//         setOutput((prev) => [...prev.slice(0, -1), "> No corrections needed or AI couldn't process the code."]);
//       }
//     } catch (err) {
//       console.error("AI correction error:", err);
//       setOutput((prev) => [...prev.slice(0, -1), "> Error while correcting code with AI."]);
//     } finally {
//       setIsCorrectingCode(false);
//     }
//   };

//   return (
//     <div className="flex flex-row items-start min-h-screen bg-gray-900 text-white p-8 gap-4">
//       <div className="flex flex-col w-2/3">
//         <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl shadow-lg">
//           <div className="flex items-center">
//             <Image
//               src={getFileIcon(language)}
//               alt={language}
//               width={40}
//               height={40}
//               className="mr-3"
//             />
//             <h1 className="text-xl font-bold text-gray-200">
//               {filename}.{language}
//             </h1>
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={handleRunCode}
//               disabled={isRunning}
//               className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-gray-600"
//             >
//               {isRunning ? "Running..." : "Run Code"}
//             </button>
//             <button
//               onClick={handleSuggestCode}
//               disabled={isSuggesting}
//               className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:bg-gray-600"
//             >
//               {isSuggesting ? "Suggesting..." : "Suggest Code"}
//             </button>
//             <button
//               onClick={handleCorrectCode}
//               disabled={isCorrectingCode}
//               className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-600"
//             >
//               {isCorrectingCode ? "Correcting..." : "Correct Code"}
//             </button>
//             <button
//               onClick={() => router.push("/user")}
//               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
//             >
//               ← Back to Files
//             </button>
//           </div>
//         </div>

//         <div className="w-full mt-4 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
//           <Editor
//             height="70vh"
//             language={language}
//             theme="vs-dark"
//             value={code}
//             onChange={(value) => setCode(value ?? "")}
//             options={{
//               fontSize: 16,
//               minimap: { enabled: false },
//               scrollBeyondLastLine: false,
//               automaticLayout: true,
//             }}
//           />
//         </div>
//       </div>

//       <div className="w-1/3 bg-black text-white rounded-lg shadow-lg border border-gray-700 flex flex-col p-4 font-mono">
//         <h2 className="text-lg font-bold text-gray-300">Terminal</h2>
//         <div className="h-64 overflow-y-auto p-2 text-sm border-b border-gray-600">
//           {output.map((line, i) => (
//             <p key={i} className="whitespace-pre-wrap text-green-400">
//               {line}
//             </p>
//           ))}
//         </div>
//         <div className="flex items-center mt-2">
//           <span className="text-blue-400">$</span>
//           <input
//             type="text"
//             className="flex-1 bg-transparent border-none focus:outline-none p-2 text-white"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && handleRunCode()}
//             placeholder="Type input and press Enter..."
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import Image from "next/image";
import { GoogleGenAI } from "@google/genai";

const LANGUAGE_CONFIG = {
  javascript: { pistonRuntime: { language: "javascript", version: "18.15.0" }, extension: "js" },
  typescript: { pistonRuntime: { language: "typescript", version: "5.0.3" }, extension: "ts" },
  python: { pistonRuntime: { language: "python", version: "3.10.0" }, extension: "py" },
  java: { pistonRuntime: { language: "java", version: "15.0.2" }, extension: "java" },
  go: { pistonRuntime: { language: "go", version: "1.16.2" }, extension: "go" },
  rust: { pistonRuntime: { language: "rust", version: "1.68.2" }, extension: "rs" },
  cpp: { pistonRuntime: { language: "cpp", version: "10.2.0" }, extension: "cpp" },
  csharp: { pistonRuntime: { language: "csharp", version: "6.12.0" }, extension: "cs" },
  ruby: { pistonRuntime: { language: "ruby", version: "3.0.1" }, extension: "rb" },
  swift: { pistonRuntime: { language: "swift", version: "5.3.3" }, extension: "swift" },
};

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_PIYUSH_GOOGLE_GENAI_API_KEY!,
});

export default function CodeEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filename = searchParams.get("filename") || "Untitled";
  const language = searchParams.get("language") || "javascript";

  const [code, setCode] = useState("// Start coding here...");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isCorrectingCode, setIsCorrectingCode] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    const fetchFile = async () => {
      if (!userId) return;
      try {
        const res = await fetch(
          `http://localhost:3001/files?filename=${filename}&language=${language}&userId=${userId}`
        );
        if (!res.ok) throw new Error("Failed to fetch file data");

        const data = await res.json();
        const file = data.find(
          (f: any) => f.filename === filename && f.language === language
        );
        if (file) {
          setCode(file.code || "");
          setFileId(file.id);
        }
      } catch (err) {
        console.error("Fetch file error:", err);
      }
    };

    fetchFile();
  }, [filename, language, userId]);

  useEffect(() => {
    if (!fileId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        await fetch(`http://localhost:3001/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
      } catch (error) {
        console.error("Failed to update file:", error);
      }
    }, 1000);
  }, [code, fileId]);

  // Scroll to bottom of terminal when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const getFileIcon = (lang: string) => {
    const available = [
      "cpp", "csharp", "go", "java", "javascript",
      "python", "ruby", "rust", "swift", "typescript",
    ];
    return available.includes(lang.toLowerCase())
      ? `/${lang.toLowerCase()}.png`
      : "/default.png";
  };

  const getExtension = (lang: string) =>
    LANGUAGE_CONFIG[lang]?.extension || lang;

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput((prev) => [...prev, "> Running..."]);

    try {
      const runtime = LANGUAGE_CONFIG[language]?.pistonRuntime;
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

      const result = await response.json();
      setOutput((prev) => [
        ...prev.slice(0, -1),
        input ? `> Input: ${input}` : "",
        result.run.stdout || result.run.stderr || "No output",
      ].filter(Boolean));
    } catch (err) {
      setOutput((prev) => [...prev, "Execution error"]);
    } finally {
      setIsRunning(false);
      setInput("");
    }
  };

  const handleSuggestCode = async () => {
    setIsSuggesting(true);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Suggest improvement or complete the following ${language} code. Comments should be in code only:\n\n${code}`,
      });

      const suggestion =
        result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (suggestion) {
        const cropped = suggestion.substring(
          3 + language.length,
          suggestion.length - 4
        );
        setCode(cropped);
      } else {
        alert("No suggestion received.");
      }
    } catch (err) {
      alert("Gemini API failed.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCorrectCode = async () => {
    setIsCorrectingCode(true);
    setOutput((prev) => [...prev, "> Correcting code with AI..."]);

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            parts: [
              {
                text: `Review and fix the following ${language} code. Identify and correct any errors, bugs, or issues. 
                Add detailed comments explaining what was fixed and why. 
                Only return the corrected code with explanatory comments. 
                Do not include any additional explanations outside of code comments.
                
                Here's the code to correct:
                
                ${code}`,
              },
            ],
          },
        ],
      });

      const correctedCode =
        result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (correctedCode) {
        let processedCode = correctedCode;
        if (processedCode.startsWith("```")) {
          processedCode = processedCode.substring(
            processedCode.indexOf("\n") + 1,
            processedCode.lastIndexOf("```")
          ).trim();
        }

        setCode(processedCode);
        setOutput((prev) => [
          ...prev.slice(0, -1),
          "> Code corrected with AI. Check comments for details.",
        ]);
      } else {
        setOutput((prev) => [
          ...prev.slice(0, -1),
          "> No corrections needed or AI couldn't process the code.",
        ]);
      }
    } catch (err) {
      console.error("AI correction error:", err);
      setOutput((prev) => [
        ...prev.slice(0, -1),
        "> Error while correcting code with AI.",
      ]);
    } finally {
      setIsCorrectingCode(false);
    }
  };

  const clearTerminal = () => {
    setOutput([]);
  };

  return (
    <div className="flex flex-row items-start min-h-screen bg-gray-900 text-white p-8 gap-4">
      <div className="flex flex-col w-2/3">
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center">
            <Image
              src={getFileIcon(language)}
              alt={language}
              width={40}
              height={40}
              className="mr-3"
            />
            <h1 className="text-xl font-bold text-gray-200">
              {filename}.{getExtension(language)}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-gray-600"
            >
              {isRunning ? "Running..." : "Run Code"}
            </button>
            <button
              onClick={handleSuggestCode}
              disabled={isSuggesting}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:bg-gray-600"
            >
              {isSuggesting ? "Suggesting..." : "Suggest Code"}
            </button>
            <button
              onClick={handleCorrectCode}
              disabled={isCorrectingCode}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-600"
            >
              {isCorrectingCode ? "Correcting..." : "Correct Code"}
            </button>
            <button
              onClick={() => router.push("/user")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
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

      <div className="w-1/3 bg-gray-850 rounded-lg shadow-lg flex flex-col">
        <div className="bg-gray-800 p-3 rounded-t-lg flex justify-between items-center border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200">Terminal</h2>
          <button 
            onClick={clearTerminal}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          >
            Clear
          </button>
        </div>
        
        <div 
          ref={terminalRef}
          className="flex-grow bg-black p-4 rounded-b-lg overflow-y-auto font-mono text-sm whitespace-pre-wrap h-[55vh]"
        >
          {output.length === 0 ? (
            <div className="text-gray-500 italic">Terminal output will appear here...</div>
          ) : (
            output.map((line, i) => (
              <div key={i} className={`mb-1 ${line.startsWith('>') ? 'text-blue-400' : 'text-green-300'}`}>
                {line}
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
          <div className="flex items-center mb-2">
            <span className="text-blue-400 mr-2">stdin</span>
            <span className="text-gray-400 text-xs">Input for your program</span>
          </div>
          <div className="flex items-center">
            <textarea
              rows={3}
              placeholder="Enter input for your program here..."
              className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700 font-mono resize-none focus:outline-none focus:border-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleRunCode();
                }
              }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Press Ctrl+Enter to run or click the Run Code button
          </div>
        </div>
      </div>
    </div>
  );
}