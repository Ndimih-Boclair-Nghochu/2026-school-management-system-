import React, { useMemo, useState } from 'react';
import './EditProfile.css';

const EditProfile = ({ profile, onSaveProfile }) => {
  const [name, setName] = useState(profile.name || '');
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || 'https://via.placeholder.com/80');
  const [avatarFile, setAvatarFile] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const shouldUpdatePassword = useMemo(
    () => currentPassword.trim() || newPassword.trim() || confirmPassword.trim(),
    [currentPassword, newPassword, confirmPassword]
  );

  const handleAvatarChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(preview);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setStatusMessage('Please enter a valid name.');
      return;
    }

    if (shouldUpdatePassword) {
      if (currentPassword !== profile.password) {
        setStatusMessage('Current password is incorrect.');
        return;
      }

      if (newPassword.trim().length < 6) {
        setStatusMessage('New password must be at least 6 characters.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setStatusMessage('New password and confirmation do not match.');
        return;
      }
    }

    onSaveProfile({
      name: cleanName,
      avatar: avatarFile ? avatarPreview : avatarPreview,
      password: shouldUpdatePassword ? newPassword : profile.password
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMessage('Profile updated successfully.');
  };

  return (
    <div className="edit-profile-root">
      <div className="edit-profile-header">
        <h2>Edit Profile</h2>
        <p>Update your name, profile picture and password. Matricule is fixed and cannot be edited.</p>
      </div>

      <form className="edit-profile-card" onSubmit={handleSave}>
        <div className="profile-avatar-block">
          <img src={avatarPreview} alt="Profile Preview" />
          <label>
            Profile Picture
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="profile-fields-grid">
          <label>
            Matricule Number
            <input type="text" value={profile.matricule} disabled />
          </label>
          <label>
            Full Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter full name" />
          </label>
        </div>

        <div className="password-box">
          <h3>Change Password</h3>
          <div className="profile-fields-grid">
            <label>
              Current Password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
              />
            </label>
          </div>
        </div>

        {statusMessage && <p className="status-message">{statusMessage}</p>}

        <button type="submit" className="save-profile-btn">Save Profile</button>
      </form>
    </div>
  );
};

export default EditProfile;
