import { useState } from 'react';

const API_URL = '/api';

function EncodeForm() {
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [password, setPassword] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMessage(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image || !password || !passphrase) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('image', image);
        formData.append('password', password);
        formData.append('passphrase', passphrase);

        try {
            const res = await fetch(`${API_URL}/encode`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to encode');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'stego_image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'Password embedded! Downloading stego image...' });
            setImage(null);
            setPreviewUrl(null);
            setPassword('');
            setPassphrase('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Cover Image (PNG)</label>
                <div className="image-preview">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" />
                    ) : (
                        <div className="placeholder">Select a PNG image</div>
                    )}
                </div>
                <input type="file" accept="image/png" onChange={handleImageChange} />
            </div>

            <div className="form-group">
                <label>Password to Hide</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secret password"
                />
            </div>

            <div className="form-group">
                <label>Passphrase (Encryption Key)</label>
                <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter passphrase"
                />
            </div>

            <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Processing...' : 'Embed Password'}
            </button>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}
        </form>
    );
}

function DecodeForm() {
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMessage(null);
            setResult(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image || !passphrase) {
            setMessage({ type: 'error', text: 'Image and passphrase are required' });
            return;
        }

        setLoading(true);
        setMessage(null);
        setResult(null);

        const formData = new FormData();
        formData.append('image', image);
        formData.append('passphrase', passphrase);

        try {
            const res = await fetch(`${API_URL}/decode`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to decode');
            }

            const data = await res.json();
            setResult(data.password);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Stego Image (PNG)</label>
                <div className="image-preview">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" />
                    ) : (
                        <div className="placeholder">Select a stego PNG image</div>
                    )}
                </div>
                <input type="file" accept="image/png" onChange={handleImageChange} />
            </div>

            <div className="form-group">
                <label>Passphrase</label>
                <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter passphrase"
                />
            </div>

            <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Processing...' : 'Extract Password'}
            </button>

            {result && (
                <div className="password-display">
                    <label>Extracted Password</label>
                    <div className="value">{result}</div>
                </div>
            )}

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}
        </form>
    );
}

export default function App() {
    const [activeTab, setActiveTab] = useState('encode');

    return (
        <>
            <h1>StegnoWeb</h1>
            <p className="subtitle">Hide passwords in images using AES-256 encryption & LSB steganography</p>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'encode' ? 'active' : ''}`}
                    onClick={() => setActiveTab('encode')}
                >
                    Encode
                </button>
                <button
                    className={`tab ${activeTab === 'decode' ? 'active' : ''}`}
                    onClick={() => setActiveTab('decode')}
                >
                    Decode
                </button>
            </div>

            <div className="card">
                {activeTab === 'encode' ? <EncodeForm /> : <DecodeForm />}
            </div>
        </>
    );
}
