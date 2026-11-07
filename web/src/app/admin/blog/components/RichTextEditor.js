"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// 🚀 Dynamically import Jodit to avoid SSR issues
const JoditEditor = dynamic(() => import("jodit-react"), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-accent/10 animate-pulse rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] text-muted-foreground/30">Deploying Tactical Environment...</div>
});

export default function RichTextEditor({ value, onChange, placeholder = "Initialize narrative data stream..." }) {
  const editor = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 🛡️ Mutation Observer to handle full-screen escape from ancestor backdrop-filter/transforms
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new MutationObserver(() => {
      const isFull = !!wrapper.querySelector(".jodit_fullsize");
      setIsFullscreen(isFull);
      if (isFull) {
        document.body.classList.add("vanguard-editor-fullscreen");
        document.documentElement.classList.add("vanguard-editor-fullscreen");
      } else {
        document.body.classList.remove("vanguard-editor-fullscreen");
        document.documentElement.classList.remove("vanguard-editor-fullscreen");
      }
    });

    observer.observe(wrapper, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"]
    });

    return () => {
      observer.disconnect();
      document.body.classList.remove("vanguard-editor-fullscreen");
      document.documentElement.classList.remove("vanguard-editor-fullscreen");
    };
  }, []);

  const toggleFullscreen = () => {
    const fullsizeBtn = wrapperRef.current?.querySelector(".jodit-toolbar-button_fullsize button");
    if (fullsizeBtn) {
      fullsizeBtn.click();
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    placeholder: placeholder,
    theme: "dark",
    minHeight: 600,
    maxHeight: "100vh",
    autofocus: false,
    spellcheck: true,
    // Editor Theme Styling
    style: {
      background: "#09090b",
      color: "#e4e4e7",
      fontSize: "15px",
      lineHeight: "1.8",
      fontFamily: "var(--font-geist-sans), Inter, sans-serif",
    },
    // Optimized Toolbar (Source & Fullsize at start)
    buttons: [
      "source", "preview", "fullsize", "|",
      "bold", "italic", "underline", "strikethrough", "|",
      "font", "fontsize", "brush", "paragraph", "|",
      "image", "video", "table", "link", "|",
      "ul", "ol", "outdent", "indent", "|",
      "align", "undo", "redo", "|",
      "hr", "eraser", "symbol", "print"
    ],
    // 🖼️ Advanced Media
    uploader: {
      insertImageAsBase64URI: true,
    },
    // 🧩 Ultimate Optimization
    toolbarAdaptive: false,
    toolbarSticky: true,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: true,
    beautifyHTML: true,
    // Ensure handles are always visible for resizing
    observer: {
      timeout: 100
    },
    // Fix for fullscreen mode in fixed layouts
    zIndex: 10000,
  }), [placeholder]);

  return (
    <div ref={wrapperRef} className="vanguard-editor-wrapper">
      {isFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="vanguard-editor-close-btn"
          title="Exit Fullscreen (Esc)"
          aria-label="Exit Fullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)}
        onChange={(newContent) => {}}
      />
      <style jsx global>{`
        /* 🛡️ Neutralize Jodit Body/HTML Collapse to 0px */
        html.vanguard-editor-fullscreen,
        body.vanguard-editor-fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          position: relative !important;
          overflow: hidden !important;
          background: #09090b !important;
        }

        /* 🛡️ Disable Containing Blocks on Ancestors to allow absolute viewport takeover */
        body.vanguard-editor-fullscreen .layout-root,
        body.vanguard-editor-fullscreen .admin-root,
        body.vanguard-editor-fullscreen main,
        body.vanguard-editor-fullscreen .max-w-7xl,
        body.vanguard-editor-fullscreen .grid,
        body.vanguard-editor-fullscreen .lg\:col-span-8,
        body.vanguard-editor-fullscreen .group\/card,
        body.vanguard-editor-fullscreen .quill-modern-container {
          backdrop-filter: none !important;
          filter: none !important;
          transform: none !important;
          overflow: visible !important;
        }

        /* 🛡️ Fullscreen Viewport Takeover */
        body.vanguard-editor-fullscreen .vanguard-editor-wrapper {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 99999999 !important;
          background: #09090b !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        body.vanguard-editor-fullscreen .jodit-container {
          height: 100vh !important;
          width: 100vw !important;
          border-radius: 0 !important;
          border: none !important;
          background: #09090b !important;
        }

        /* 🛡️ Strict Dark Theme Enforcement to override default white inline styles */
        .jodit_fullsize,
        .jodit-container_fullsize,
        .jodit-container.jodit_fullsize,
        .jodit-container,
        .jodit-workplace,
        .jodit-wysiwyg,
        .jodit-iframe,
        .jodit-editor__area {
          background: #09090b !important;
          background-color: #09090b !important;
          color: #e4e4e7 !important;
        }

        .jodit-wysiwyg p,
        .jodit-wysiwyg span,
        .jodit-wysiwyg div {
          color: #e4e4e7 !important;
        }

        .jodit_fullsize {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 1000000 !important;
          margin: 0 !important;
          border-radius: 0 !important;
          overflow: hidden !important;
        }

        .jodit-container {
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          background: #09090b !important;
          border-radius: 12px !important;
          overflow: hidden;
        }

        .jodit-toolbar__box {
          background: #09090b !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 12px 24px !important;
        }

        .jodit-workplace {
          background: transparent !important;
          padding: 30px !important;
        }

        .jodit-status-bar {
          background: #09090b !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #71717a !important;
          padding: 10px 24px !important;
        }

        .jodit-toolbar-button__button {
          color: #a1a1aa !important;
        }

        .jodit-toolbar-button__button:hover {
          background: rgba(225, 29, 72, 0.1) !important;
          color: #f43f5e !important;
        }

        /* Tactical Tooltip/Dropdown Fixes */
        .jodit-ui-panel, .jodit-ui-popup {
          background: #18181b !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          color: white !important;
          z-index: 1000001 !important;
        }

        /* 🛡️ High-Premium Glassmorphic Floating Close Button */
        .vanguard-editor-close-btn {
          position: fixed !important;
          top: 16px !important;
          right: 20px !important;
          z-index: 100000005 !important;
          width: 44px !important;
          height: 44px !important;
          border-radius: 50% !important;
          background: rgba(24, 24, 27, 0.9) !important; /* Lighter zinc for contrast */
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1.5px solid rgba(244, 63, 94, 0.3) !important; /* Rose tinted border */
          color: #f43f5e !important; /* Striking tactical rose/red color */
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(244, 63, 94, 0.25) !important; /* Gorgeous soft glow */
          padding: 0 !important;
        }

        .vanguard-editor-close-btn:hover {
          background: #f43f5e !important; /* Solid red on hover */
          border-color: #f43f5e !important;
          color: white !important;
          transform: scale(1.1) rotate(90deg) !important;
          box-shadow: 0 0 25px rgba(244, 63, 94, 0.6) !important;
        }

        .vanguard-editor-close-btn svg {
          width: 20px !important;
          height: 20px !important;
          transition: transform 0.4s ease !important;
        }

        .vanguard-editor-close-btn:active {
          transform: scale(0.9) rotate(90deg) !important;
        }
      `}</style>
    </div>
  );
}
