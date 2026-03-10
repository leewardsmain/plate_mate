import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword, confirmResetPassword } from '../../services/authAdapter';
import { useAppStore } from '../../store/useAppStore';
import styles from './Auth.module.css';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { addToast } = useAppStore();

    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const output = await resetPassword({ username: email });
            const { nextStep } = output;

            if (nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
                setStep(2);
                addToast('Password reset code sent to your email.', 'success');
            } else if (nextStep.resetPasswordStep === 'DONE') {
                addToast('Password reset complete.', 'success');
                navigate('/login');
            }
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to send reset link. Please check the email.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await confirmResetPassword({
                username: email,
                confirmationCode: code,
                newPassword: newPassword
            });

            addToast('Password updated successfully! Please sign in.', 'success');
            navigate('/login');
        } catch (err: any) {
            console.error('Confirm reset error:', err);
            setError(err.message || 'Failed to reset password. Check your code.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authLayout}>
            <div className={styles.authBackground}>
                <div className={styles.blob1} />
                <div className={styles.blob2} />
            </div>

            <main className={styles.authCard}>
                <header className={styles.header}>
                    <div className={styles.brandLogo}>
                        <span className={`material-symbols-outlined ${styles.brandIcon}`}>lock_reset</span>
                    </div>
                    <h1 className={styles.title}>Reset Password</h1>
                    <p className={styles.subtitle}>
                        {step === 1 ? "Enter your email and we'll send you a link to reset your password." : "Enter the verification code and your new password."}
                    </p>
                </header>

                {step === 1 ? (
                    <form onSubmit={handleRequestReset} className={styles.formGroup}>
                        {error && <div className={styles.errorText}>{error}</div>}

                        <div className={styles.inputField}>
                            <label className={styles.inputLabel} htmlFor="email">Email</label>
                            <div className={styles.inputWrap}>
                                <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
                                <input
                                    id="email"
                                    type="email"
                                    className={styles.textInput}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.btnSubmit}
                            disabled={isLoading || !email}
                        >
                            {isLoading ? 'Sending...' : 'Send Recovery Link'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirmReset} className={styles.formGroup}>
                        {error && <div className={styles.errorText}>{error}</div>}

                        <div className={styles.inputField}>
                            <label className={styles.inputLabel} htmlFor="code">Verification Code</label>
                            <div className={styles.inputWrap}>
                                <span className={`material-symbols-outlined ${styles.inputIcon}`}>pin</span>
                                <input
                                    id="code"
                                    type="text"
                                    className={styles.textInput}
                                    placeholder="Enter code from email"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.inputField}>
                            <label className={styles.inputLabel} htmlFor="newPassword">New Password</label>
                            <div className={styles.inputWrap}>
                                <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock</span>
                                <input
                                    id="newPassword"
                                    type="password"
                                    className={styles.textInput}
                                    placeholder="Create a new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.btnSubmit}
                            disabled={isLoading || !code || !newPassword}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <footer className={styles.footer}>
                    <Link to="/login" className={styles.linkText}>Back to Sign In</Link>
                </footer>
            </main>
        </div>
    );
}
