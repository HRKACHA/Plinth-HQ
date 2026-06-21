import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { galleryApi, uploadApi, mediaUrl } from '../../api/index';
import { Image, ExternalLink, Upload, Camera, Image as ImageIcon } from 'lucide-react';

export default function Gallery() {
  const { id } = useParams();
  const { data: gallery, loading, refresh } = useAsync(() => galleryApi.list(id), [id]);
  const [filter, setFilter] = useState('All');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const uploadedData = await uploadApi.file(file);
      await galleryApi.upload(id, { url: uploadedData.url });
      refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  const safeGallery = gallery || [];
  const filteredGallery = filter === 'All' ? safeGallery : safeGallery.filter(item => item.source === filter);

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-navy flex items-center gap-2">
          <Image className="h-5 w-5 text-orange" />
          Project Gallery
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            {['All', 'Direct Upload', 'Project Chat', 'Daily Log', 'Issue/Snag'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition-all ${filter === f ? 'bg-orange/20 text-orange border border-orange/30' : 'bg-surface text-muted hover:text-navy border border-white/5'}`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button 
              onClick={() => cameraInputRef.current?.click()} 
              disabled={uploading}
              className="flex-1 sm:flex-none btn-secondary flex items-center justify-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>{uploading ? '...' : 'Camera'}</span>
            </button>
            <input 
              type="file" 
              ref={cameraInputRef}
              onChange={handleUpload}
              accept="image/*"
              capture="environment"
              className="hidden" 
            />

            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*"
              className="hidden" 
            />
          </div>
        </div>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredGallery.map((item, index) => (
          <div key={`${item.id}-${index}`} className="relative group overflow-hidden rounded-xl border border-white/5 bg-card break-inside-avoid">
            <img src={mediaUrl(item.url)} alt={item.title} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <span className="text-xs font-semibold text-orange mb-1">{item.source}</span>
              <p className="text-sm font-bold text-white mb-1 line-clamp-1">{item.title}</p>
              <div className="flex justify-between items-center text-xs text-white/70">
                <span>{new Date(item.date).toLocaleDateString()}</span>
                <span>{item.uploader}</span>
              </div>
              <a href={mediaUrl(item.url)} target="_blank" rel="noreferrer" className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-colors">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredGallery.length === 0 && (
        <div className="py-20 text-center text-muted card">
          <Image className="mx-auto h-16 w-16 opacity-20 mb-4" />
          <p className="text-lg">No photos found in {filter === 'All' ? 'this project' : filter}.</p>
          <p className="text-sm mt-1">Photos uploaded to Daily Logs or Issues will appear here automatically.</p>
        </div>
      )}
    </div>
  );
}
