import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { galleryApi, uploadApi, mediaUrl } from '../../api/index';
import { Image, ExternalLink, Upload, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Gallery() {
  const { id } = useParams();
  const { user } = useAuth();
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

  const groupedGallery = {};
  filteredGallery.forEach(item => {
    const dateKey = new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (!groupedGallery[dateKey]) groupedGallery[dateKey] = [];
    groupedGallery[dateKey].push(item);
  });

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      await galleryApi.delete(id, item.id, { source: item.source, url: item.url });
      refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete photo');
    }
  };

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
                className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition-all ${filter === f ? 'bg-orange/20 text-orange border border-orange/30' : 'bg-surface text-muted hover:text-navy border border-navy/5 dark:border-white/5'}`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-navy/10 dark:bg-white/10 hidden sm:block"></div>
          
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

      <div className="space-y-8">
        {Object.entries(groupedGallery).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-navy/90 dark:text-white/70 mb-4 sticky top-0 bg-surface z-10 py-2 border-b border-navy/5 dark:border-white/5">{date}</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 sm:gap-3">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="relative group overflow-hidden rounded-xl border border-navy/5 dark:border-white/5 bg-surface aspect-square">
                  <a href={mediaUrl(item.url)} target="_blank" rel="noreferrer" className="block w-full h-full">
                    <img src={mediaUrl(item.url)} alt={item.title} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-1" />
                  </a>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                    <span className="text-xs font-semibold text-orange mb-1">{item.source}</span>
                    <p className="text-sm font-bold text-navy dark:text-white mb-1 line-clamp-1">{item.title}</p>
                    <div className="flex justify-between items-center text-xs text-navy/90 dark:text-white/70">
                      <span>{item.uploader}</span>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
                      <a href={mediaUrl(item.url)} target="_blank" rel="noreferrer" className="p-1.5 bg-navy/10 dark:bg-white/10 hover:bg-navy/20 dark:bg-white/20 backdrop-blur-md rounded-lg text-navy dark:text-white transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {['owner', 'Owner'].includes(user?.role) && (
                        <button onClick={() => handleDelete(item)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md rounded-lg text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
