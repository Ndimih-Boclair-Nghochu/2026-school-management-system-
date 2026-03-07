import React, { useState } from 'react';
import './LoginPage.css';
import { useSchoolConfig } from './schoolConfig';

const CAMPUS_IMAGE = 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=1200&q=80';

const LoginPage = ({ onLogin, onCreateAccount, onStartPasswordRecovery, onVerifyRecoveryOtp, onResetPassword }) => {
  const schoolConfig = useSchoolConfig();
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('identify');
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [demoOtpPreview, setDemoOtpPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchToCreateMode = (event) => {
    event.preventDefault();
    setIsCreateMode(true);
    setIsForgotMode(false);
    setForgotStep('identify');
    setMatricule('');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setDemoOtpPreview('');
    setError('');
    setSuccess('');
  };

  const switchToForgotMode = (event) => {
    event.preventDefault();
    setIsCreateMode(false);
    setIsForgotMode(true);
    setForgotStep('identify');
    setMatricule('');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setDemoOtpPreview('');
    setError('');
    setSuccess('');
  };

  const switchToLoginMode = (event) => {
    if (event) {
      event.preventDefault();
    }

    setIsCreateMode(false);
    setIsForgotMode(false);
    setForgotStep('identify');
    setMatricule('');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setDemoOtpPreview('');
    setError('');
  };

  const fillDemoRecoveryAccount = () => {
    setMatricule('TCH2026');
    setPhoneNumber('677000111');
    setError('');
    setSuccess('');
  };

  const fillDemoTeacherLogin = () => {
    setMatricule('TCH2026');
    setPassword('demo1234');
    setError('');
    setSuccess('');
  };

  const fillDemoStudentLogin = () => {
    setMatricule('STD2026');
    setPassword('student123');
    setError('');
    setSuccess('');
  };

  const fillDemoLibrarianLogin = () => {
    setMatricule('LIB2026');
    setPassword('librarian123');
    setError('');
    setSuccess('');
  };

  const fillDemoParentLogin = () => {
    setMatricule('PAR2026');
    setPassword('parent123');
    setError('');
    setSuccess('');
  };

  const fillDemoAccountantLogin = () => {
    setMatricule('ACC2026');
    setPassword('accountant123');
    setError('');
    setSuccess('');
  };

  const fillDemoAdminLogin = () => {
    setMatricule('ADM2026');
    setPassword('admin123');
    setError('');
    setSuccess('');
  };

  const submitForm = (event) => {
    event.preventDefault();
    const id = matricule.trim();
    const pass = password.trim();

    if (isForgotMode) {
      if (forgotStep === 'identify') {
        const phone = phoneNumber.trim();

        if (!id || !phone) {
          setError('Please enter your matricule and phone number.');
          setSuccess('');
          return;
        }

        const generatedOtp = onStartPasswordRecovery(id, phone);
        if (!generatedOtp) {
          setError('No matching account found for this matricule and phone number.');
          setSuccess('');
          return;
        }

        setForgotStep('otp');
        setOtpCode('');
        setDemoOtpPreview(generatedOtp);
        setError('');
        setSuccess(`OTP sent successfully. Demo OTP: ${generatedOtp}`);
        return;
      }

      if (forgotStep === 'otp') {
        const otp = otpCode.trim();
        if (!/^\d{6}$/.test(otp)) {
          setError('Please enter a valid 6 digit OTP code.');
          setSuccess('');
          return;
        }

        const validOtp = onVerifyRecoveryOtp(id, otp);
        if (!validOtp) {
          setError('Invalid OTP code. Please try again.');
          setSuccess('');
          return;
        }

        setForgotStep('reset');
        setError('');
        setSuccess('OTP verified. Enter your new password.');
        return;
      }

      const nextPassword = newPassword.trim();
      const nextConfirmPassword = confirmNewPassword.trim();

      if (!nextPassword || !nextConfirmPassword) {
        setError('Please enter and confirm your new password.');
        setSuccess('');
        return;
      }

      if (nextPassword !== nextConfirmPassword) {
        setError('New passwords do not match.');
        setSuccess('');
        return;
      }

      if (nextPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        setSuccess('');
        return;
      }

      const resetDone = onResetPassword(id, otpCode.trim(), nextPassword);
      if (!resetDone) {
        setError('Unable to reset password. Please restart recovery.');
        setSuccess('');
        return;
      }

      switchToLoginMode();
      setMatricule(id);
      setPassword('');
      setError('');
      setSuccess('Password changed successfully. Please sign in with your new password.');
      return;
    }

    if (isCreateMode) {
      const confirm = confirmPassword.trim();

      if (!id || !pass || !confirm) {
        setError('Please complete all account fields.');
        setSuccess('');
        return;
      }

      if (pass !== confirm) {
        setError('Passwords do not match.');
        setSuccess('');
        return;
      }

      const created = onCreateAccount(id, pass);
      const createSuccess = typeof created === 'object' ? Boolean(created?.success) : Boolean(created);
      const createMessage = typeof created === 'object' ? created?.message : '';

      if (!createSuccess) {
        setError(createMessage || 'This matricule cannot be used to create an account.');
        setSuccess('');
        return;
      }

      switchToLoginMode();
      setSuccess(createMessage || 'Account created successfully. Please log in.');
      return;
    }

    if (!id || !pass) {
      setError('Please enter your matricule number and password.');
      setSuccess('');
      return;
    }

    const success = onLogin(id, pass);
    if (!success) {
      setError('Invalid credentials. Use any demo account shown below.');
      setSuccess('');
    }
  };

  return (
    <div className="login-page-root">
      <div className="login-card">
        <div className="login-image-panel">
          <img src={CAMPUS_IMAGE} alt="School campus" />
        </div>

        <div className="login-form-panel">
          <div className="login-brand">
            <img src={schoolConfig.logoUrl} alt="School logo" />
            <h1>{schoolConfig.shortName}</h1>
            <p>{schoolConfig.systemTitle}</p>
          </div>

          <div className="login-form-head">
            <h2>{isForgotMode ? 'Recover Password' : isCreateMode ? 'Create Account' : 'Sign In'}</h2>
            <p>
              {isForgotMode
                ? forgotStep === 'identify'
                  ? 'Step 1 of 3: Enter your matricule and registered phone number.'
                  : forgotStep === 'otp'
                    ? 'Step 2 of 3: Enter the 6 digit OTP code sent to your phone.'
                    : 'Step 3 of 3: Set and confirm your new password.'
                : isCreateMode
                  ? 'Create your account using matricule and password.'
                  : 'Enter your credentials to access your dashboard.'}
            </p>
          </div>

          {isForgotMode && demoOtpPreview && (
            <div className="otp-demo-box">
              <span>Demo OTP Code</span>
              <strong>{demoOtpPreview}</strong>
            </div>
          )}

          <form onSubmit={submitForm} className="login-form">
            {isForgotMode ? (
              <>
                <label>
                  Matricule Number
                  <input
                    type="text"
                    value={matricule}
                    onChange={(event) => {
                      setMatricule(event.target.value);
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="Enter matricule number"
                    readOnly={forgotStep !== 'identify'}
                  />
                </label>

                {forgotStep === 'identify' && (
                  <label>
                    Phone Number
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) => {
                        setPhoneNumber(event.target.value);
                        setError('');
                        setSuccess('');
                      }}
                      placeholder="Enter phone number"
                    />
                  </label>
                )}

                {forgotStep === 'identify' && (
                  <button type="button" className="demo-recovery-btn" onClick={fillDemoRecoveryAccount}>
                    Use Demo Recovery Account
                  </button>
                )}

                {forgotStep === 'otp' && (
                  <label>
                    6 Digit OTP Code
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(event) => {
                        const cleanOtp = event.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(cleanOtp);
                        setError('');
                        setSuccess('');
                      }}
                      placeholder="Enter 6 digit OTP"
                      className="otp-input"
                    />
                  </label>
                )}

                {forgotStep === 'reset' && (
                  <>
                    <label>
                      New Password
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setError('');
                          setSuccess('');
                        }}
                        placeholder="Enter new password"
                      />
                    </label>

                    <label>
                      Confirm New Password
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(event) => {
                          setConfirmNewPassword(event.target.value);
                          setError('');
                          setSuccess('');
                        }}
                        placeholder="Confirm new password"
                      />
                    </label>
                  </>
                )}
              </>
            ) : (
              <>
                <label>
                  Matricule Number
                  <input
                    type="text"
                    value={matricule}
                    onChange={(event) => {
                      setMatricule(event.target.value);
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="Enter matricule number"
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="Enter password"
                  />
                </label>
              </>
            )}

            {isCreateMode && !isForgotMode && (
              <label>
                Confirm Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  placeholder="Confirm password"
                />
              </label>
            )}

            {error && <p className="login-error">{error}</p>}
            {success && <p className="login-success">{success}</p>}

            <button type="submit">
              {isForgotMode
                ? forgotStep === 'identify'
                  ? 'Continue'
                  : forgotStep === 'otp'
                    ? 'Verify OTP'
                    : 'Reset Password'
                : isCreateMode
                  ? 'Create Account'
                  : 'Login'}
            </button>
          </form>

          <div className="login-links">
            {isCreateMode || isForgotMode ? (
              <a href="#signin" onClick={switchToLoginMode}>Back to Sign In</a>
            ) : (
              <>
                <a href="#forgot" onClick={switchToForgotMode}>Forgot Password?</a>
                <a href="#create" onClick={switchToCreateMode}>Create Account</a>
              </>
            )}
          </div>

          <div className="demo-account">
            <strong>Demo Accounts</strong>
            <span>Teacher • Matricule: TCH2026 • Password: demo1234 • Phone: 677000111</span>
            <span>Student • Matricule: STD2026 • Password: student123 • Phone: 677000222</span>
            <span>Librarian • Matricule: LIB2026 • Password: librarian123 • Phone: 677000333</span>
            <span>Parent • Matricule: PAR2026 • Password: parent123 • Phone: 677000444</span>
            <span>Accountant • Matricule: ACC2026 • Password: accountant123 • Phone: 677000555</span>
            <span>Admin • Matricule: ADM2026 • Password: admin123 • Phone: 677000666</span>
            {!isCreateMode && !isForgotMode && (
              <div className="demo-login-actions">
                <button type="button" onClick={fillDemoTeacherLogin}>Use Teacher Demo</button>
                <button type="button" onClick={fillDemoStudentLogin}>Use Student Demo</button>
                <button type="button" onClick={fillDemoLibrarianLogin}>Use Librarian Demo</button>
                <button type="button" onClick={fillDemoParentLogin}>Use Parent Demo</button>
                <button type="button" onClick={fillDemoAccountantLogin}>Use Accountant Demo</button>
                <button type="button" onClick={fillDemoAdminLogin}>Use Admin Demo</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
