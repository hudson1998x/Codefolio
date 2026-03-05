import React, { useEffect, useState, useRef } from "react";

export interface FileUploaderProps {
  basePath?: string;
  onUploaded?: (files: File[]) => void;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  basePath = "",
  onUploaded,
  multiple = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);
  };

  // --- Clipboard Functionality ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            // Create a descriptive name for the clipboard image
            const file = new File([blob], `pasted-image-${Date.now()}.${blob.type.split('/')[1]}`, {
              type: blob.type
            });
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        handleFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [multiple]); // Re-bind if multiple setting changes

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      // Ensure path is appended FIRST for the backend parser logic we wrote earlier
      formData.append("path", basePath);
      selectedFiles.forEach(f => formData.append("file", f));

      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      if (res.ok) {
        onUploaded?.(selectedFiles);
        setSelectedFiles([]);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="cf-uploader">
      <div 
        className={`cf-uploader-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          hidden
        />
        <div className="zone-content">
          <span className="icon">📤</span>
          <p>Drag files, <strong>browse</strong>, or paste from clipboard</p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="cf-uploader-list">
          {selectedFiles.map((file, i) => (
            <div key={i} className="cf-uploader-file">
              <span className="file-name">
                {file.type.startsWith('image/') ? '🖼️ ' : '📄 '}
                {file.name}
              </span>
              <button 
                className="remove-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFiles(f => f.filter((_, idx) => idx !== i));
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        className="cf-uploader-submit"
        onClick={handleUpload}
        disabled={uploading || selectedFiles.length === 0}
      >
        {uploading ? "Transferring..." : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} to /${basePath || 'root'}`}
      </button>
    </div>
  );
};