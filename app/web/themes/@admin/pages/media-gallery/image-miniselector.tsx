import React, { useState } from "react";
import { FileUploader } from "@components/file-upload";
import { MediaGalleryPage } from "./"; // Adjust path as needed
import { MediaMiniExplorer } from "./minitree";

interface ImageUploaderProps {
  value: string;
  onChange: (val: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'url' | 'upload' | 'gallery'>('url');
  const [showGallery, setShowGallery] = useState(false);

  return (
    <div className="image-uploader-field">
      <div className="uploader-tabs">
        <button 
            type='button'
          className={mode === 'url' ? 'active' : ''} 
          onClick={() => setMode('url')}
        >URL</button>
        <button 
            type='button'
          className={mode === 'upload' ? 'active' : ''} 
          onClick={() => setMode('upload')}
        >Upload</button>
        <button 
            type='button'
          onClick={() => setShowGallery(true)}
        >Library</button>
      </div>

      <div className="uploader-content">
        {mode === 'url' && (
          <input
            type="text"
            placeholder="https://..."
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {mode === 'upload' && (
          <FileUploader
            multiple={false}
            basePath="uploads"
            onUploaded={(files) => {
              // Assuming your server returns the path or you know the structure
              const path = `uploads/${files[0].name}`;
              onChange(path);
              setMode('url'); // Switch back to URL to show the path
            }}
          />
        )}
      </div>

      {/* Modal for Media Gallery Selection */}
      {showGallery && (
        <div className="media-gallery-modal-overlay">
          <div className="media-gallery-modal-content">
            <header>
              <h3>Select Image</h3>
              <button type='button' onClick={() => setShowGallery(false)}>✕</button>
            </header>
            <div className="gallery-wrapper">
              <MediaMiniExplorer 
                // We pass a selection override so clicking a file selects it 
                // rather than opening the previewer
                onSelect={(node) => {
                  if (node.type === 'file') {
                    onChange(node.path ? '/media/' + node.path : "");
                    setShowGallery(false);
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};