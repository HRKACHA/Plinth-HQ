import { useParams } from 'react-router-dom';
import { useRef, useState } from 'react';
import { Upload, Search, FileText, Download, X, Save } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../data/mockData';
import { useAsync } from '../../hooks/useAsync';
import { documentApi, mediaUrl } from '../../api/index';
import CustomSelectMenu from '../../components/common/CustomSelectMenu';

export default function DocumentManager() {
  const { id } = useParams();
  const { data: documents = [], loading, reload } = useAsync(() => documentApi.list(id), [id]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ file: null, name: '', type: 'drawing', tags: '' });

  const getDownloadUrl = (url, docName) => {
    if (!url) return '';
    const fullUrl = mediaUrl(url);
    if (fullUrl.includes('res.cloudinary.com') && fullUrl.includes('/upload/')) {
      const parts = fullUrl.split('/upload/');
      return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
    }
    return fullUrl;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.file) return alert('Please select a file to upload');
    
    try {
      setUploading(true);
      const metadata = {
        name: uploadData.name || uploadData.file.name,
        type: uploadData.type,
        tags: uploadData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await documentApi.upload(id, uploadData.file, metadata);
      setShowUploadModal(false);
      setUploadData({ file: null, name: '', type: 'drawing', tags: '' });
      reload();
    } catch (err) {
      console.error(err);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-orange" /></div>;

  return (
    <div>
      <div className="mb-6 flex justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search documents..." className="input-field pl-10" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowUploadModal(true)} className="btn-accent">
            <Upload className="h-4 w-4" /> Upload
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 bg-info/50 text-left text-xs uppercase text-muted">
              <th className="px-5 py-3">Document</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Version</th>
              <th className="px-5 py-3">Uploaded</th>
              <th className="px-5 py-3">Tags</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? documents.map((doc, i) => (
              <tr key={doc._id} className={i % 2 === 0 ? 'bg-card' : 'bg-info/20'}>
                <td className="px-5 py-4">
                  <a href={mediaUrl(doc.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-orange transition cursor-pointer">
                    <FileText className="h-4 w-4 text-navy" />
                    <span className="font-medium">{doc.name}</span>
                  </a>
                </td>
                <td className="px-5 py-4"><Badge status={doc.type} /></td>
                <td className="px-5 py-4 font-mono">v{doc.version}</td>
                <td className="px-5 py-4 text-muted">{formatDate(doc.createdAt)}</td>
                <td className="px-5 py-4">{(doc.tags || []).map((t) => <span key={t} className="badge bg-info text-navy text-[10px] mr-1">{t}</span>)}</td>
                <td className="px-5 py-4">
                  <a href={getDownloadUrl(doc.fileUrl, doc.name)} download={doc.name} target="_blank" rel="noreferrer" className="hover:text-orange transition">
                    <Download className="h-4 w-4 text-muted hover:text-orange" />
                  </a>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted/30 mb-3" />
                  <h4 className="text-lg font-bold text-navy">No Documents Uploaded</h4>
                  <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                    Upload project blueprints, architectural drawings, site permits, contracts, or material specifications here. Supported files: PDF, JPG, PNG, DOCX.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showUploadModal && (
        <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between border-b border-navy/5 pb-4">
              <h2 className="text-xl font-bold text-navy">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-muted hover:text-navy transition"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-navy">Select File</label>
                <input 
                  type="file" 
                  required 
                  onChange={e => setUploadData({...uploadData, file: e.target.files[0], name: uploadData.name || e.target.files[0]?.name || ''})} 
                  className="w-full text-sm text-navy file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange/10 file:text-orange-dark hover:file:bg-orange/20 cursor-pointer border border-navy/10 rounded-lg p-2" 
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-navy">Document Name / Brief Info</label>
                <input type="text" required value={uploadData.name} onChange={e => setUploadData({...uploadData, name: e.target.value})} className="input-field py-2" placeholder="e.g., Foundation Blueprint Rev 2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">Document Type</label>
                  <CustomSelectMenu 
                    value={uploadData.type} 
                    onChange={val => setUploadData({...uploadData, type: val})}
                    options={[
                      {value: 'drawing', label: 'Drawing'},
                      {value: 'permit', label: 'Permit'},
                      {value: 'contract', label: 'Contract'},
                      {value: 'invoice', label: 'Invoice'},
                      {value: 'other', label: 'Other'}
                    ]}
                    placeholder="Document Type"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">Tags (comma separated)</label>
                  <input type="text" value={uploadData.tags} onChange={e => setUploadData({...uploadData, tags: e.target.value})} className="input-field py-2" placeholder="e.g., architecture, draft" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-semibold text-navy hover:bg-info rounded-lg transition">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-accent py-2"><Upload className="mr-2 h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload File'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
