'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../styles/Billing.scss'
import UserProfile from '@/app/session/UserProfile'

export default function Billing() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    // Payment form state
    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvc, setCvc] = useState('')
    const [cardName, setCardName] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    const handlePayment = async () => {
        setLoading(true)
        setError('')

        try {
            // Basic client-side validation before processing
            const validation = validateAllFields({ cardNumber, expiry, cvc, cardName })
            setFieldErrors(validation.errors || {})

            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Payment success is determined by validations here (for demo)
            const paymentSuccess = validation.isValid

            if (!paymentSuccess) {
                throw new Error('Payment failed due to invalid card data. Please check the highlighted fields.')
            }

            // Call subscription update API
            const response = await fetch('/api/subscription/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionData: "premium"
                })
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Failed to update subscription')
            }

            alert('Payment successful! Your subscription has been upgraded.')
            
            // Redirect to main page after success
            UserProfile.setSubscriptionAccess(null);
            setTimeout(() => {
                router.push('/mainPage')
            }, 1500)

        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Helpers for formatting / limiting inputs
    const formatCardNumber = (digits) => {
        // group digits in 4s: 1234 5678 9012 3456
        return digits.replace(/\W/g, '').match(/.{1,4}/g)?.join(' ') || digits
    }

    const formatExpiryInput = (digits) => {
        // digits may be MMYY or MMYYYY; we will format to MM/YY
        const only = digits.replace(/[^0-9]/g, '')
        if (only.length === 0) return ''
        if (only.length <= 2) return only
        // take first two as month, next two as year (YY)
        const month = only.slice(0, 2)
        const year = only.slice(2, 4)
        return `${month}/${year}`
    }

    // Handler for input changes that also performs lightweight validation + limits
    const handleChange = (field, value) => {
        // compute new values locally so validation uses them immediately
        let newCardNumber = cardNumber
        let newExpiry = expiry
        let newCvc = cvc
        let newCardName = cardName

        if (field === 'cardNumber') {
            const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 16)
            newCardNumber = formatCardNumber(digitsOnly)
            setCardNumber(newCardNumber)
        }

        if (field === 'expiry') {
            newExpiry = formatExpiryInput(value).slice(0, 5)
            setExpiry(newExpiry)
        }

        if (field === 'cvc') {
            newCvc = value.replace(/[^0-9]/g, '').slice(0, 4)
            setCvc(newCvc)
        }

        if (field === 'cardName') {
            newCardName = value.slice(0, 50)
            setCardName(newCardName)
        }

        // validate using the freshly computed values
        const currentValidation = validateAllFields({ cardNumber: newCardNumber, expiry: newExpiry, cvc: newCvc, cardName: newCardName })
        setFieldErrors(currentValidation.errors)
        return currentValidation.isValid
    }

    // -- Validation helpers -------------------------------------------------
    const luhnCheck = (num) => {
        const sanitized = num.replace(/\s+/g, '')
        if (!/^[0-9]+$/.test(sanitized)) return false
        let sum = 0
        let shouldDouble = false
        for (let i = sanitized.length - 1; i >= 0; i--) {
            let digit = parseInt(sanitized.charAt(i), 10)
            if (shouldDouble) {
                digit *= 2
                if (digit > 9) digit -= 9
            }
            sum += digit
            shouldDouble = !shouldDouble
        }
        return sum % 10 === 0
    }

    const validateExpiry = (value) => {
        // Accept MM/YY or MM/YYYY
        const v = value.trim()
        const match = v.match(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/)
        if (!match) return false
        let month = parseInt(match[1], 10)
        let year = parseInt(match[2], 10)
        if (year < 100) {
            // two-digit year -> convert to 20xx (reasonable assumption)
            year += 2000
        }
        const now = new Date()
        const expiryDate = new Date(year, month - 1, 1)
        // Set to last day of the month
        expiryDate.setMonth(expiryDate.getMonth() + 1)
        expiryDate.setDate(0)
        // card is valid if expiryDate >= today (end of month)
        return expiryDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    const validateAllFields = ({ cardNumber, expiry, cvc, cardName }) => {
        const errors = {}
        const sanitizedNumber = (cardNumber || '').replace(/\s+/g, '')

        if (!sanitizedNumber || sanitizedNumber.length !== 16) {
            errors.cardNumber = 'Card number must be exactly 16 digits.'
        } else if (!luhnCheck(sanitizedNumber)) {
            errors.cardNumber = 'Card number failed validation (check your digits).'
        }

        if (!expiry || !validateExpiry(expiry)) {
            errors.expiry = 'Expiry date is invalid or expired.'
        }

        if (!/^[0-9]{3,4}$/.test(cvc || '')) {
            errors.cvc = 'CVC must be 3 or 4 digits.'
        }

        if (!cardName || cardName.trim().length < 2) {
            errors.cardName = 'Please enter the cardholder name.'
        }

        return { isValid: Object.keys(errors).length === 0, errors }
    }

    // quick derived validity for UI (disable pay button until valid)
    const isFormValid = validateAllFields({ cardNumber, expiry, cvc, cardName }).isValid

    return (
        <div className="billing-page">
            <div className="billing-header">
                <h1>Upgrade Your Workspace</h1>
                <p>Choose the plan that fits your team's needs</p>
            </div>

            {error && (
                <div className="billing-error">
                    {error}
                </div>
            )}

                <div className={`billing-plan  billing-plan--selected`}>
                    <div className="billing-plan__header">
                        <h3>Premium</h3>
                        <div className="billing-plan__price">
                            <span className="billing-plan__amount">$29</span>
                            <span className="billing-plan__period">/month</span>
                        </div>
                    </div>
                    <div className="billing-plan__features">
                        <div className="billing-plan__feature">
                            <span className="billing-plan__check">✓</span>
                            Unlimited contracts
                        </div>
                        <div className="billing-plan__feature">
                            <span className="billing-plan__check">✓</span>
                            Advanced date tracking
                        </div>
                        <div className="billing-plan__feature">
                            <span className="billing-plan__check">✓</span>
                            Team collaboration
                        </div>
                        <div className="billing-plan__feature">
                            <span className="billing-plan__check">✓</span>
                            Automated email reminders
                        </div>
                    </div>
                </div>

            <div className="billing-payment">
                <div className="billing-payment__section">
                    <h4>Payment Information</h4>
                    <div className="billing-payment__form">
                        <div className="billing-payment__field">
                            <label>Card Number</label>
                            <input 
                                type="text" 
                                inputMode="numeric"
                                maxLength={19}
                                placeholder="1234 5678 9012 3456"
                                className={`billing-payment__input ${fieldErrors.cardNumber ? 'billing-input--error' : ''}`}
                                value={cardNumber}
                                onChange={(e) => handleChange('cardNumber', e.target.value)}
                            />
                            {fieldErrors.cardNumber && (
                                <div className="billing-field-error">{fieldErrors.cardNumber}</div>
                            )}
                        </div>
                        <div className="billing-payment__row">
                            <div className="billing-payment__field">
                                <label>Expiry Date</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength={5}
                                    placeholder="MM/YY"
                                    className={`billing-payment__input ${fieldErrors.expiry ? 'billing-input--error' : ''}`}
                                    value={expiry}
                                    onChange={(e) => handleChange('expiry', e.target.value)}
                                />
                                {fieldErrors.expiry && (
                                    <div className="billing-field-error">{fieldErrors.expiry}</div>
                                )}
                            </div>
                            <div className="billing-payment__field">
                                <label>CVC</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="123"
                                    className={`billing-payment__input ${fieldErrors.cvc ? 'billing-input--error' : ''}`}
                                    value={cvc}
                                    onChange={(e) => handleChange('cvc', e.target.value)}
                                />
                                {fieldErrors.cvc && (
                                    <div className="billing-field-error">{fieldErrors.cvc}</div>
                                )}
                            </div>
                        </div>
                        <div className="billing-payment__field">
                            <label>Cardholder Name</label>
                            <input 
                                type="text" 
                                maxLength={50}
                                placeholder="John Doe"
                                className={`billing-payment__input ${fieldErrors.cardName ? 'billing-input--error' : ''}`}
                                value={cardName}
                                onChange={(e) => handleChange('cardName', e.target.value)}
                            />
                            {fieldErrors.cardName && (
                                <div className="billing-field-error">{fieldErrors.cardName}</div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading || !isFormValid}
                    className="billing-payment__button"
                >
                    {loading ? 'Processing Payment...' : `Pay $29`}
                </button>

                <p className="billing-payment__notice">
                    This is a demo payment system. No real charges will be made.
                </p>
            </div>
        </div>
    )
}