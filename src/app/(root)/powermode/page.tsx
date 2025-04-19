// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { GoogleGenAI } from "@google/genai";
// import Image from "next/image";

// // Initialize Google GenAI with your API key
// const ai = new GoogleGenAI({
//   apiKey: process.env.NEXT_PUBLIC_PIYUSH_GOOGLE_GENAI_API_KEY!,
// });

// export default function AppGenerator() {
//   const router = useRouter();
//   const [userId, setUserId] = useState<string | null>(null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [appDescription, setAppDescription] = useState("");
//   const [projectName, setProjectName] = useState("");
//   const [appType, setAppType] = useState("web-app");
//   const [complexity, setComplexity] = useState("simple");
//   const [logs, setLogs] = useState<string[]>([]);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   // Template options
//   const appTypes = [
//     { id: "web-app", name: "Single Page App", icon: "/webapp.png" },
//     { id: "dashboard", name: "Dashboard", icon: "/dashboard.png" },
//     { id: "ecommerce", name: "E-commerce", icon: "/ecommerce.png" },
//     { id: "portfolio", name: "Portfolio", icon: "/portfolio.png" },
//     { id: "game", name: "Simple Game", icon: "/game.png" },
//   ];

//   // Complexity options
//   const complexityOptions = [
//     { id: "simple", name: "Simple", description: "Basic functionality" },
//     { id: "medium", name: "Medium", description: "More features and styling" },
//     { id: "complex", name: "Complex", description: "Advanced features and interactions" },
//   ];

//   useEffect(() => {
//     const storedUserId = localStorage.getItem("userId");
//     if (!storedUserId) {
//       router.push("/login");
//     } else {
//       setUserId(storedUserId);
//     }
//   }, []);

//   // Generate a suitable project name based on the description
//   useEffect(() => {
//     if (appDescription.length > 10) {
//       const words = appDescription
//         .split(" ")
//         .filter(word => word.length > 3)
//         .slice(0, 2)
//         .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

//       if (words.length > 0) {
//         setProjectName(words.join("") + "App");
//       }
//     }
//   }, [appDescription]);

//   const addLog = (message: string) => {
//     setLogs(prev => [...prev, message]);
//   };

//   const handleGenerateApp = async () => {
//     if (!appDescription || !projectName) {
//       alert("Please provide a description and project name");
//       return;
//     }

//     setIsGenerating(true);
//     setPreviewUrl(null);
//     addLog(`🚀 Starting to generate ${appType} with ${complexity} complexity...`);

//     try {
//       addLog("📝 Planning application architecture...");
//       const planResult = await ai.models.generateContent({
//         model: "gemini-2.0-flash",
//         contents: [{
//           parts: [{
//             text: `Create an architecture plan for a ${complexity} ${appType} based on this description: "${appDescription}".
//             Return a concise JSON structure with:
//             1. List of necessary files (HTML, CSS, JS)
//             2. Key features to implement
//             3. Libraries to use (if any)
//             4. Basic data structure
//             Format as valid JSON only.`
//           }]
//         }]
//       });

//       let plan;
//       try {
//         const planText = planResult.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//         // Extract JSON if it's wrapped in code blocks
//         const jsonMatch = planText.match(/```json\n([\s\S]*?)\n```/) ||
//                           planText.match(/```\n([\s\S]*?)\n```/);
//         plan = JSON.parse(jsonMatch ? jsonMatch[1] : planText);
//         addLog("✅ Architecture plan created successfully");
//       } catch (err) {
//         addLog("⚠️ Could not parse architecture plan, using default structure");
//         plan = {
//           files: ["index.html", "styles.css", "script.js"],
//           features: ["Basic UI", "Core functionality"],
//           libraries: [],
//           dataStructure: {}
//         };
//       }

//       // Step 2: Generate each file in parallel
//       addLog("🔨 Generating application files...");
//       const filePromises = plan.files.map(async (filename: string) => {
//         addLog(`📄 Creating ${filename}...`);

//         let fileType = "unknown";
//         if (filename.endsWith(".html")) fileType = "HTML";
//         else if (filename.endsWith(".css")) fileType = "CSS";
//         else if (filename.endsWith(".js")) fileType = "JavaScript";

//         const fileResult = await ai.models.generateContent({
//           model: "gemini-2.0-flash",
//           contents: [{
//             parts: [{
//               text: `Generate the ${fileType} code for ${filename} for a ${complexity} ${appType} based on:

//               Description: "${appDescription}"

//               This file is part of the following structure:
//               ${JSON.stringify(plan.files)}

//               Include these features:
//               ${JSON.stringify(plan.features)}

//               ${plan.libraries.length > 0 ? `Use these libraries: ${JSON.stringify(plan.libraries)}` : ""}

//               Return ONLY the complete code with no explanations or comments outside the code.`
//             }]
//           }]
//         });

//         let content = fileResult.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//         // Remove markdown code blocks if present
//         content = content.replace(/```[a-z]*\n|```/g, "").trim();

//         return { filename, content };
//       });

//       const files = await Promise.all(filePromises);
//       addLog("✅ All files generated successfully!");

//       // Step 3: Save the project files
//       addLog("💾 Saving project files to your account...");

//       for (const file of files) {
//         const extension = file.filename.split('.').pop() || "";
//         let language = "javascript"; // default

//         if (extension === "html") language = "html";
//         else if (extension === "css") language = "css";
//         else if (extension === "js") language = "javascript";

//         // Create file in your backend
//         const res = await fetch("http://localhost:3001/files", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             userId,
//             filename: file.filename.split('.')[0], // remove extension
//             language,
//             code: file.content,
//             project: projectName
//           }),
//         });

//         if (!res.ok) {
//           throw new Error(`Failed to save ${file.filename}`);
//         }
//       }

//       addLog("✅ Project saved successfully!");

//       // Step 4: Create a preview (optional)
//       try {
//         const indexHtml = files.find(f => f.filename === "index.html")?.content || "";
//         const css = files.find(f => f.filename === "styles.css")?.content || "";
//         const js = files.find(f => f.filename === "script.js")?.content || "";

//         // Create a blob URL for preview (this stays in browser memory)
//         const htmlWithInlineResources = `
//           <!DOCTYPE html>
//           <html lang="en">
//           <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <style>${css}</style>
//             <title>${projectName}</title>
//           </head>
//           <body>
//             ${indexHtml.replace(/<link.*?>/g, "")}
//             <script>${js}</script>
//           </body>
//           </html>
//         `;

//         const blob = new Blob([htmlWithInlineResources], { type: "text/html" });
//         const previewUrl = URL.createObjectURL(blob);
//         setPreviewUrl(previewUrl);
//         addLog("🖥️ Preview generated! You can view your app below.");
//       } catch (err) {
//         addLog("⚠️ Could not generate preview, but your files are saved.");
//       }

//     } catch (err) {
//       console.error("App generation error:", err);
//       addLog("❌ Error generating application. Please try again.");
//     } finally {
//       setIsGenerating(false);
//       addLog("✨ Generation process completed");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white p-8">
//       <div className="max-w-6xl mx-auto">
//         <header className="flex justify-between items-center mb-8">
//           <h1 className="text-3xl font-bold">AI App Generator</h1>
//           <button
//             onClick={() => router.push("/user")}
//             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
//           >
//             ← Back to Dashboard
//           </button>
//         </header>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
//             <h2 className="text-xl font-semibold mb-4">Describe Your App</h2>

//             <div className="mb-6">
//               <label className="block text-gray-300 mb-2">Project Name</label>
//               <input
//                 type="text"
//                 value={projectName}
//                 onChange={(e) => setProjectName(e.target.value)}
//                 placeholder="MyAwesomeApp"
//                 className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
//               />
//             </div>

//             <div className="mb-6">
//               <label className="block text-gray-300 mb-2">App Description</label>
//               <textarea
//                 value={appDescription}
//                 onChange={(e) => setAppDescription(e.target.value)}
//                 placeholder="Describe your app in detail. What should it do? What features should it have? What should it look like?"
//                 className="w-full p-3 h-40 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
//               />
//             </div>

//             <div className="mb-6">
//               <label className="block text-gray-300 mb-2">App Type</label>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
//                 {appTypes.map((type) => (
//                   <div
//                     key={type.id}
//                     onClick={() => setAppType(type.id)}
//                     className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col items-center justify-center ${
//                       appType === type.id
//                         ? "border-blue-500 bg-blue-900/30"
//                         : "border-gray-600 hover:border-gray-400"
//                     }`}
//                   >
//                     <div className="w-10 h-10 mb-2 relative">
//                       <Image
//                         src={type.icon}
//                         alt={type.name}
//                         layout="fill"
//                         objectFit="contain"
//                       />
//                     </div>
//                     <span className="text-sm text-center">{type.name}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="mb-8">
//               <label className="block text-gray-300 mb-2">Complexity</label>
//               <div className="grid grid-cols-3 gap-3">
//                 {complexityOptions.map((option) => (
//                   <div
//                     key={option.id}
//                     onClick={() => setComplexity(option.id)}
//                     className={`p-3 rounded-lg border cursor-pointer transition-all ${
//                       complexity === option.id
//                         ? "border-blue-500 bg-blue-900/30"
//                         : "border-gray-600 hover:border-gray-400"
//                     }`}
//                   >
//                     <h3 className="font-medium">{option.name}</h3>
//                     <p className="text-xs text-gray-400">{option.description}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <button
//               onClick={handleGenerateApp}
//               disabled={isGenerating || !appDescription || !projectName}
//               className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
//             >
//               {isGenerating ? "Generating App..." : "Generate App with AI"}
//             </button>
//           </div>

//           <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
//             <h2 className="text-xl font-semibold mb-4">Generation Log</h2>

//             <div className="flex-1 overflow-y-auto bg-black rounded-lg p-4 font-mono text-sm mb-4">
//               {logs.length === 0 ? (
//                 <p className="text-gray-500 italic">Generation logs will appear here...</p>
//               ) : (
//                 logs.map((log, i) => (
//                   <p key={i} className="mb-1 whitespace-pre-wrap text-green-400">
//                     {log}
//                   </p>
//                 ))
//               )}
//             </div>

//             {previewUrl && (
//               <div className="mt-auto">
//                 <h3 className="text-lg font-medium mb-2">Preview</h3>
//                 <div className="w-full h-96 rounded-lg border border-gray-600 overflow-hidden">
//                   <iframe
//                     src={previewUrl}
//                     title="App Preview"
//                     className="w-full h-full bg-white"
//                     sandbox="allow-scripts"
//                   />
//                 </div>
//                 <div className="flex justify-between mt-3">
//                   <button
//                     onClick={() => window.open(previewUrl, "_blank")}
//                     className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg"
//                   >
//                     Open in New Tab
//                   </button>
//                   <button
//                     onClick={() => router.push(`/edit?project=${projectName}`)}
//                     className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
//                   >
//                     Edit Generated Files
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleGenAI } from "@google/genai";
import Image from "next/image";

// Initialize Google GenAI with your API key
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_PIYUSH_GOOGLE_GENAI_API_KEY!,
});

export default function AppGenerator() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appDescription, setAppDescription] = useState("");
  const [projectName, setProjectName] = useState("");
  const [appType, setAppType] = useState("web-app");
  const [complexity, setComplexity] = useState("simple");
  const [logs, setLogs] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Template options
  const appTypes = [
    { id: "web-app", name: "Single Page App", icon: "/webapp.png" },
    { id: "dashboard", name: "Dashboard", icon: "/dashboard.png" },
    { id: "ecommerce", name: "E-commerce", icon: "/ecommerce.png" },
    { id: "portfolio", name: "Portfolio", icon: "/portfolio.png" },
    { id: "game", name: "Simple Game", icon: "/game.png" },
  ];

  // Complexity options
  const complexityOptions = [
    { id: "simple", name: "Simple", description: "Basic functionality" },
    { id: "medium", name: "Medium", description: "More features and styling" },
    {
      id: "complex",
      name: "Complex",
      description: "Advanced features and interactions",
    },
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  // Clean up any blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Generate a suitable project name based on the description
  useEffect(() => {
    if (appDescription.length > 10) {
      const words = appDescription
        .split(" ")
        .filter((word) => word.length > 3)
        .slice(0, 2)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );

      if (words.length > 0) {
        setProjectName(words.join("") + "App");
      }
    }
  }, [appDescription]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
    console.log(message); // Also log to console for debugging
  };

  const handleGenerateApp = async () => {
    if (!appDescription || !projectName) {
      alert("Please provide a description and project name");
      return;
    }

    setIsGenerating(true);
    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    setLogs([]);  // Clear previous logs
    addLog(
      `🚀 Starting to generate ${appType} with ${complexity} complexity...`
    );

    try {
      addLog("📝 Planning application architecture...");
      const planResult = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            parts: [
              {
                text: `Create an architecture plan for a ${complexity} ${appType} based on this description: "${appDescription}".
            Return a concise JSON structure with:
            1. List of necessary files (HTML, CSS, JS)
            2. Key features to implement
            3. Libraries to use (if any)
            4. Basic data structure
            Format as valid JSON only.`,
              },
            ],
          },
        ],
      });

      let plan;
      try {
        const planText = planResult.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        // Extract JSON if it's wrapped in code blocks
        const jsonMatch =
          planText.match(/```json\n([\s\S]*?)\n```/) ||
          planText.match(/```\n([\s\S]*?)\n```/);
        plan = JSON.parse(jsonMatch ? jsonMatch[1] : planText);
        addLog("✅ Architecture plan created successfully");
      } catch (err) {
        addLog("⚠️ Could not parse architecture plan, using default structure");
        plan = {
          files: ["index.html", "styles.css", "script.js"],
          features: ["Basic UI", "Core functionality"],
          libraries: [],
          dataStructure: {},
        };
      }

      // Ensure plan.files is an array
      if (!plan.files) {
        plan.files = ["index.html", "styles.css", "script.js"];
        addLog("⚠️ No files found in plan, using default files");
      } else if (!Array.isArray(plan.files)) {
        // If it's a string or other type, convert to array
        if (typeof plan.files === 'string') {
          plan.files = [plan.files];
          addLog("⚠️ Converting single file to array");
        } else {
          plan.files = ["index.html", "styles.css", "script.js"];
          addLog("⚠️ Invalid files format in plan, using default files");
        }
      }

      // Ensure other properties exist
      if (!Array.isArray(plan.features)) {
        plan.features = ["Basic UI"];
      }
      
      if (!Array.isArray(plan.libraries)) {
        plan.libraries = [];
      }
      
      // Make sure we have the minimum required files for a web app
      const requiredFiles = ["index.html", "styles.css", "script.js"];
      requiredFiles.forEach(file => {
        if (!plan.files.includes(file)) {
          plan.files.push(file);
          addLog(`⚠️ Added missing required file: ${file}`);
        }
      });
      
      // Step 2: Generate each file in parallel
      addLog("🔨 Generating application files...");
      
      const filePromises = plan.files.map(async (filename: string) => {
        addLog(`📄 Creating ${filename}...`);

        let fileType = "unknown";
        if (typeof filename === 'string') {
          if (filename.endsWith(".html")) fileType = "HTML";
          else if (filename.endsWith(".css")) fileType = "CSS";
          else if (filename.endsWith(".js")) fileType = "JavaScript";
        } else {
          addLog("⚠️ Invalid filename format, treating as text file");
          filename = "unknown.txt";
        }

        const fileResult = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              parts: [
                {
                  text: `Generate the ${fileType} code for ${filename} for a ${complexity} ${appType} based on:
                    
                    Description: "${appDescription}"
                    
                    This file is part of the following structure:
                    ${JSON.stringify(plan.files)}
                    
                    Include these features:
                    ${JSON.stringify(plan.features)}
                    
                    ${
                      plan.libraries && plan.libraries.length > 0
                        ? `Use these libraries: ${JSON.stringify(
                            plan.libraries
                          )}`
                        : ""
                    }
                    
                    Return ONLY the complete code with no explanations or comments outside the code.
                    ${
                      fileType === "HTML"
                        ? "Make sure to create a complete, valid HTML file with proper <!DOCTYPE html>, <html>, <head>, and <body> tags."
                        : ""
                    }`,
                },
              ],
            },
          ],
        });

        // This line was incorrect - fixed from responseId to response
        let content = fileResult.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        
        // Remove markdown code blocks if present
        content = content.replace(/```[a-z]*\n|```/g, "").trim();

        // For HTML files, make sure they have a proper structure
        if (filename === "index.html" && !content.includes("<!DOCTYPE html>")) {
          addLog("⚠️ Generated HTML lacks proper document structure, fixing...");
          content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  ${content}
</body>
</html>`;
        }

        return { filename, content };
      });

      const files = await Promise.all(filePromises);
      addLog("✅ All files generated successfully!");

      // Step 3: Save the project files
      addLog("💾 Saving project files to your account...");

      for (const file of files) {
        const fileNameStr = typeof file.filename === 'string' ? file.filename : 'unknown.txt';
        const extension = fileNameStr.split(".").pop() || "";
        let language = "javascript"; // default

        if (extension === "html") language = "html";
        else if (extension === "css") language = "css";
        else if (extension === "js") language = "javascript";

        // Create file in your backend
        const res = await fetch("http://localhost:3001/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            filename: fileNameStr.split(".")[0], // remove extension
            language,
            code: file.content,
            project: projectName,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to save ${fileNameStr}`);
        }
      }

      addLog("✅ Project saved successfully!");

      // Step 4: Create a preview
      try {
        const htmlFile = files.find((f) => typeof f.filename === 'string' && f.filename === "index.html");
        const cssFile = files.find((f) => typeof f.filename === 'string' && f.filename === "styles.css");
        const jsFile = files.find((f) => typeof f.filename === 'string' && f.filename === "script.js");

        if (!htmlFile) {
          throw new Error("No HTML file found");
        }

        addLog(`Found HTML file: ${!!htmlFile}`);
        addLog(`Found CSS file: ${!!cssFile}`);
        addLog(`Found JS file: ${!!jsFile}`);

        let htmlContent = htmlFile.content;
        const cssContent = cssFile?.content || "";
        const jsContent = jsFile?.content || "";
        
        // Make sure we have a proper HTML structure
        if (!htmlContent.includes("<!DOCTYPE html>")) {
          htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  ${cssContent ? `<style>${cssContent}</style>` : ''}
</head>
<body>
  ${htmlContent}
  ${jsContent ? `<script>${jsContent}</script>` : ''}
</body>
</html>`;
        } else {
          // If HTML already has structure, inject CSS and JS more carefully
          if (cssContent) {
            // Insert CSS into the head
            if (htmlContent.includes('</head>')) {
              htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
            } else {
              // If no head tag, try to add after the html opening tag
              htmlContent = htmlContent.replace(/<html([^>]*)>/, `<html$1><head><style>${cssContent}</style></head>`);
            }
          }
          
          if (jsContent) {
            // Insert JavaScript right before the closing body tag
            if (htmlContent.includes('</body>')) {
              htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script></body>`);
            } else {
              // If no body closing tag, add to the end
              htmlContent += `<script>${jsContent}</script>`;
            }
          }
        }

        // Log preview content for debugging
        console.log("Preview HTML content:", htmlContent);
        addLog(`Preview HTML size: ${htmlContent.length} characters`);

        // Create a blob URL for preview
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        addLog("🖥️ Preview generated! You can view your app below.");
      } catch (err) {
        console.error("Preview generation error:", err);
        addLog(`⚠️ Could not generate preview: ${(err as Error).message}. Your files are still saved.`);
      }
    } catch (err) {
      console.error("App generation error:", err);
      addLog(`❌ Error generating application: ${(err as Error).message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      addLog("✨ Generation process completed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">AI App Generator</h1>
          <button
            onClick={() => router.push("/user")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            ← Back to Dashboard
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block mb-2 font-semibold">Project Name</label>
            <input 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)} 
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg mb-4"
            />
            <label className="block mb-2 font-semibold">Description</label>
            <textarea
              rows={4}
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg mb-4"
              placeholder="What should this app do?"
            />

            <label className="block mb-2 font-semibold">App Template</label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {appTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setAppType(type.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${
                    appType === type.id ? "border-blue-500" : "border-gray-700"
                  } hover:border-blue-400`}
                >
                  <Image
                    src={type.icon}
                    alt={type.name}
                    width={32}
                    height={32}
                  />
                  {type.name}
                </div>
              ))}
            </div>

            <label className="block mb-2 font-semibold">Complexity</label>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {complexityOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setComplexity(opt.id)}
                  className={`p-2 rounded-lg cursor-pointer border ${
                    complexity === opt.id
                      ? "border-blue-500"
                      : "border-gray-700"
                  } hover:border-blue-400`}
                >
                  <h4 className="font-semibold">{opt.name}</h4>
                  <p className="text-sm text-gray-400">{opt.description}</p>
                </div>
              ))}
            </div>

            <button
              disabled={isGenerating}
              onClick={handleGenerateApp}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate App 🚀"}
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg overflow-auto h-[600px]">
            <h2 className="text-xl font-bold mb-2">Generation Logs</h2>
            <div className="space-y-2 text-sm">
              {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </div>
        </div>

        {previewUrl && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">🔍 Live Preview</h2>
            <iframe
              src={previewUrl}
              className="w-full h-[500px] border rounded-lg"
              sandbox="allow-scripts allow-same-origin allow-modals"
              title={`${projectName} preview`}
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
}