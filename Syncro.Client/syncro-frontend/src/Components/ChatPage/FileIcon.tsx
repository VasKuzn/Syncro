import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileArchive, FaFileAudio, FaFileVideo } from 'react-icons/fa';

export function getFileIconByType(type: string | undefined, fileName: string | undefined) {
    if (!type && fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FaFilePdf color="#e74c3c" size={32} />;
            case 'doc':
            case 'docx': return <FaFileWord color="#2980b9" size={32} />;
            case 'xls':
            case 'xlsx': return <FaFileExcel color="#27ae60" size={32} />;
            case 'zip':
            case 'rar':
            case '7z': return <FaFileArchive color="#f39c12" size={32} />;
            case 'mp3':
            case 'ogg': return <FaFileAudio color="#8e44ad" size={32} />;
            case 'mp4':
            case 'webm': return <FaFileVideo color="#16a085" size={32} />;
            default: return <FaFileAlt size={32} />;
        }
    }
    if (!type) return <FaFileAlt size={32} />;
    if (type.startsWith('image/')) return null;
    if (type.startsWith('video/')) return <FaFileVideo color="#16a085" size={32} />;
    if (type.startsWith('audio/')) return <FaFileAudio color="#8e44ad" size={32} />;
    if (type === 'application/pdf') return <FaFilePdf color="#e74c3c" size={32} />;
    if (type.includes('word')) return <FaFileWord color="#2980b9" size={32} />;
    if (type.includes('excel')) return <FaFileExcel color="#27ae60" size={32} />;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <FaFileArchive color="#f39c12" size={32} />;
    return <FaFileAlt size={32} />;
}
