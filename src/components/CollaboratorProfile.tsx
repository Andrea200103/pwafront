export default function CollaboratorProfile({ user, onClose }: any) {
  return (
    <div className="modal-overlay">
      <div className="modal-card profile-card">
        <div className="avatar-large">
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <h2>{user.name}</h2>
        <p className="muted">{user.email}</p>
        <span className="badge" style={{ background: "#1f6feb" }}>
          Colaborador
        </span>
        <button
          className="btn primary"
          onClick={onClose}
          style={{ marginTop: 20, width: "100%" }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}