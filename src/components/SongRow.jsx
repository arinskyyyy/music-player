import heartIcon from '../assets/heart.svg';

export default function SongRow({ title, artist, thumbnail }) {
    return (
    <div className="song-row">
        <img src={thumbnail} alt="Album Art" className="row-thumbnail" />
        <div className="row-text-stack">
        <span className="row-title">{title}</span>
        <span className="row-artist">{artist}</span>
        </div>
        <button className="row-like-btn">
        <img src={heartIcon} alt="Like" className="custom-icon" />
        </button>
    </div>
    );
}