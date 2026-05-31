import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FiUpload } from "react-icons/fi";
import axios from "axios";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { IoImageOutline, IoTrashOutline } from "react-icons/io5";

const UploadNode = ({ id, data, formValues, setFormValues, selectedModel, loading, uploadType, acceptType }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageMetadata, setImageMetadata] = useState({ width: 0, height: 0, size: null });
  const videoRef = useRef(null);
  const prevFormValues = useRef(formValues);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e);
  };

  const handleFileUpload = (e) => {
    let file = null;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    } else {
      return;
    }

    let acceptedTypes = [];

    if (acceptType === "image") {
      acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    } else if (acceptType === "video") {
      acceptedTypes = ["video/mp4", "video/webm"];
    } else if (acceptType === "audio") {
      acceptedTypes = ["audio/mpeg", "audio/wav", "audio/webm"];
    }

    const type = file.type.startsWith("video") ? "video_url" : file.type.startsWith("image") ? "image_url": "audio_url";
    
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Please upload a valid ${acceptType} file`);
      return;
    };

    setUploading(true);
    axios.get("/api/app/get_file_upload_url", {
      params: { filename: file.name }
    })
    .then((response) => {
      const { url, fields } = response.data;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);
      axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      })
      .then(() => {
        const prefix = "https://cdn.muapi.ai/";
        const uploadedUrl = prefix + fields.key;
        setFormValues(prev => ({ ...prev, [type]: uploadedUrl }));

        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      })
    })
    .catch((error) => {
      console.error("Upload failed", error);
      toast.error("Upload failed.", error?.response?.data);
      setUploading(false);
      setUploadProgress(0);
    })  
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }; 

  const handleTextChange = (e) => {
    const textValue = e.target.value;
    setFormValues(prev => ({ ...prev, prompt: textValue }));
  };

  const handleWorkflowInputChange = (e) => {
    const workflowInputValue = e.target.checked;
    setFormValues(prev => ({ ...prev, is_workflow_input: workflowInputValue }));
  };

  const removeData = () => {
    const key = acceptType === "image" ? "image_url": acceptType === "video" ? "video_url": "audio_url";
    setFormValues(prev => ({ ...prev, [key]: null }))
  };

  useEffect(() => {
    let outputs = [{
      type: "",
      value: null
    }];
    let resultUrl;

    if (acceptType === "image") {
      outputs = [{ 
        type: "image_url", 
        value: formValues.image_url ? formValues.image_url: null,
      }];
      resultUrl = formValues.image_url ? formValues.image_url: null;
    } else if (acceptType === "video") {
      outputs = [{ 
        type: "video_url", 
        value: formValues.video_url ? formValues.video_url: null,
      }];
      resultUrl = formValues.video_url ? formValues.video_url: null;
    } else if (acceptType === "audio") {
      outputs = [{ 
        type: "audio_url", 
        value: formValues.audio_url ? formValues.audio_url: null,
      }];
      resultUrl = formValues.audio_url ? formValues.audio_url: null;
    } else {
      outputs = [{ 
        type: "text", 
        value: formValues.prompt ? formValues.prompt: "",
      }];
      resultUrl = formValues.prompt ? formValues.prompt: "";
    };

    if (acceptType === "image" && resultUrl) {
      const img = new Image();
      img.onload = () => {
        setImageMetadata(prev => ({ 
          ...prev, 
          width: img.naturalWidth, 
          height: img.naturalHeight 
        }));
      };
      img.src = resultUrl;
      
      fetch(resultUrl, { method: 'HEAD' })
        .then(res => {
          const size = res.headers.get('content-length');
          if (size) {
            const sizeInMB = (parseInt(size) / (1024 * 1024)).toFixed(2);
            setImageMetadata(prev => ({ ...prev, size: sizeInMB + ' MB' }));
          } else {
            setImageMetadata(prev => ({ ...prev, size: null }));
          }
        })
        .catch(() => {
          setImageMetadata(prev => ({ ...prev, size: null }));
        });
    } else if (acceptType === "image") {
      setImageMetadata({ width: 0, height: 0, size: null });
    }
    
    // if (!data.formValues) return;
    const incoming = JSON.stringify(prevFormValues.current);
    const current = JSON.stringify(formValues);
    if (incoming === current) return;
    prevFormValues.current = formValues;

    if (data?.onDataChange) {
      data?.onDataChange(id, {
        selectedModel,
        formValues,
        loading,
        outputs: outputs,
        resultUrl: resultUrl,
      });
    }
  }, [formValues, selectedModel, loading, id, data, acceptType]);

  const hasFileUrl = formValues?.image_url || formValues?.video_url || formValues?.audio_url;
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(scrollHeight, 240)}px`;
    }
  }, [formValues?.prompt]);

  return (
    <div className="flex flex-col w-full flex-1 overflow-hidden rounded-b-2xl h-full">
      <div className="flex flex-col items-center justify-center w-full h-full flex-1">
        {uploadType === "text" ? (
          <textarea
            ref={textareaRef}
            className="bg-transparent border border-gray-800 w-full h-full max-h-96 p-2 text-xs text-white resize-none overflow-y-auto custom-scrollbar"
            placeholder="Enter your text prompt here..."
            value={formValues?.prompt || ""}
            onChange={handleTextChange}
          />
        ) : uploadType === "upload" && (
          <div 
            className="flex flex-col items-center justify-center w-full h-full relative" 
            onDragOver={handleDragOver} onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col justify-center gap-2 w-full h-full max-w-[95%]">
                <h4 className="text-xs text-white">Uploading... {uploadProgress}%</h4>
                <div className="w-full bg-gray-100 rounded h-1 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : hasFileUrl ? (
              <div className="flex-1 w-full h-full group z-0">
                {formValues?.video_url ? (
                  <div className="relative w-full h-full">
                    <VideoPlayer 
                      src={formValues?.video_url}
                      accentColor="#f97316"
                    />
                  </div>
                ) : formValues?.image_url ? (
                  <div className="relative w-full h-full group/image">
                    <img
                      src={formValues?.image_url}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-white/50 uppercase tracking-tighter font-semibold">Dimensions</span>
                          <span className="text-xs text-white font-medium tabular-nums">
                            {imageMetadata.width} × {imageMetadata.height}
                          </span>
                        </div>
                        {imageMetadata.size && (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-white/50 uppercase tracking-tighter font-semibold">File Size</span>
                            <span className="text-xs text-white font-medium tabular-nums">{imageMetadata.size}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative group/audio flex flex-col items-center justify-center">
                    <AudioPlayer 
                      nodeId={id}
                      src={formValues?.audio_url} 
                      className="flex flex-col items-center justify-center px-5 py-4 w-full h-full relative group transition-all duration-500 select-none bg-black/10 rounded-b-2xl"
                    />
                  </div>
                )}
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  className="text-white hover:text-red-500 bg-black/40 hover:bg-black cursor-pointer absolute left-4 top-4 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={removeData}
                >
                  &#10005;
                </button>
              </div>
            ) : (
              <label 
                style={{ minHeight: 200 }} 
                className="cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-400 border border-dashed border-gray-600 rounded-lg p-4 w-full flex-1 hover:bg-gray-700/50 h-full"
              >                <FiUpload size={20} />
                <span className="text-xs capitalize">Upload {acceptType}</span>
                <span className="text-xs text-gray-500">Hint: drag and drop file(s) here.</span>
                <input
                  type="file"
                  accept={acceptType === "image" ? "image/*": acceptType === "video" ? "video/*": "audio/*"}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadNode;
