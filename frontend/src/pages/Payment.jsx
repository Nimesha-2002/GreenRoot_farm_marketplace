import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { placeOrder,generateOTP,verifyOTP} from '../services/api';

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId, productName, price, quantity, deliveryAddress, consumerName, totalAmount, token, isCart, cartItems } = location.state || {};

  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isFlipped, setIsFlipped] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);
  const DELIVERY_FEE = 450;
  const grandTotal = Number(totalAmount);

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'number') {
      value = value.replace(/\D/g, '').slice(0, 16);
      value = value.replace(/(.{4})/g, '$1 ').trim();
    }
    if (e.target.name === 'expiry') {
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (e.target.name === 'cvv') {
      const maxLen = getCardType(card.number).type === 'Amex' ? 4 : 3;
      value = value.replace(/\D/g, '').slice(0, maxLen);
    }
    setCard({ ...card, [e.target.name]: value });
  };

  const getCardType = (number) => {
    const num = number.replace(/\s/g, '');
    if (/^4/.test(num)) return { type: 'Visa', color: '#1a1f71', symbol: 'VISA', gradient: 'linear-gradient(135deg, #1a1f71, #4caf50)' };
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return { type: 'Mastercard', color: '#eb001b', symbol: 'MC', gradient: 'linear-gradient(135deg, #eb001b, #f79e1b)' };
    if (/^3[47]/.test(num)) return { type: 'Amex', color: '#007bc1', symbol: 'AMEX', gradient: 'linear-gradient(135deg, #007bc1, #00c6ff)' };
    return { type: '', color: '#2d5a27', symbol: '💳', gradient: 'linear-gradient(135deg, #2d5a27, #4caf50)' };
  };

  const isExpiryValid = (expiry) => {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10) + 2000;
    if (month < 1 || month > 12) return false;
    const now = new Date();
    if (year < now.getFullYear()) return false;
    if (year === now.getFullYear() && month < now.getMonth() + 1) return false;
    return true;
  };

  const isValidCardNumber = (number) => {
    const num = number.replace(/\s/g, '');
    if (num.length !== 16) return false;
    let sum = 0;
    let isEven = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);
      if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const handlePay = async () => {
    if (paymentMethod === 'card') {
      if (!card.name.trim() || !card.number || !card.expiry || !card.cvv) { setError('Please fill all card details!'); return; }
      if (!isValidCardNumber(card.number)) { setError('Invalid card number!'); return; }
      if (!isExpiryValid(card.expiry)) { setError('Card expiry date is invalid or expired!'); return; }
      const cvvLen = getCardType(card.number).type === 'Amex' ? 4 : 3;
      if (card.cvv.length < cvvLen) { setError(`Please enter a valid ${cvvLen}-digit CVV!`); return; }

      // Generate actual OTP and send to customer email
      setLoading(true);
      setError('');
      try {
        await generateOTP(token);
        setOtpCode('');
        setOtpError('');
        setShowOtpModal(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to generate and send OTP. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (paymentMethod === 'bank') {
      if (!receiptFile) {
        setError('Please upload your bank deposit slip as proof of payment!');
        return;
      }
    }

    await processOrderPayment();
  };

  const handleResendOtp = async () => {
    setResending(true);
    setOtpError('');
    try {
      await generateOTP(token);
      setOtpError('A new OTP has been sent to your email.');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const processOrderPayment = async (receiptUrl = '') => {
    setLoading(true);
    setError('');

    try {
      let finalReceipt = receiptUrl;

      // Upload bank receipt if paying via Bank Transfer and receipt is not already uploaded
      if (paymentMethod === 'bank' && receiptFile && !receiptUrl) {
        const formData = new FormData();
        formData.append('receipt', receiptFile);

        const uploadRes = await fetch('http://localhost:5000/api/payment/upload-receipt', {
          method: 'POST',
          headers: { authorization: token },
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error('Bank receipt upload failed. Please try again.');
        }

        const uploadData = await uploadRes.json();
        finalReceipt = uploadData.receiptUrl;
      }

      if (isCart && cartItems) {
        // Group items by farmer
        const farmerGroups = {};
        cartItems.forEach(item => {
          if (!farmerGroups[item.farmer]) {
            farmerGroups[item.farmer] = [];
          }
          farmerGroups[item.farmer].push(item);
        });

        for (let i = 0; i < cartItems.length; i++) {
          const item = cartItems[i];
          const isLastItem = i === cartItems.length - 1;

          // Farmer's items only for farmer email
          const farmerItems = farmerGroups[item.farmer];
          const isLastItemForThisFarmer = farmerItems[farmerItems.length - 1]._id === item._id;

          await placeOrder({
            productId: item._id,
            quantity: item.cartQuantity,
            deliveryAddress: deliveryAddress || 'To be confirmed',
            consumerName,
            deliveryFee: isLastItem ? 450 : 0,
            paymentMethod,
            bankReceipt: finalReceipt,
            isCart: true,
            isLastCartItem: isLastItem,
            isLastItemForFarmer: isLastItemForThisFarmer,
            farmerCartSummary: farmerItems.map(fi => ({
              name: fi.name,
              subCategory: fi.subCategory || '',
              quantity: fi.cartQuantity,
              price: fi.price * fi.cartQuantity
            })),
            cartSummary: cartItems.map(ci => ({
              name: ci.name,
              subCategory: ci.subCategory || '',
              quantity: ci.cartQuantity,
              price: ci.price * ci.cartQuantity
            }))
          }, token);
        }
      } else {
        await placeOrder({
          productId,
          quantity: Number(quantity),
          deliveryAddress,
          consumerName,
          deliveryFee: 450,
          paymentMethod,
          bankReceipt: finalReceipt
        }, token);
      }

      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        const tokenVal = localStorage.getItem('token');
        let cartKey = 'cart_guest';
        if (tokenVal) {
          try {
            const decoded = JSON.parse(atob(tokenVal.split('.')[1]));
            cartKey = `cart_${decoded.id || 'guest'}`;
          } catch {}
        }
        localStorage.removeItem(cartKey);
        window.dispatchEvent(new Event('cart-clear'));
        setTimeout(() => navigate('/consumer'), 5000);
      }, 2000);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Payment failed. Try again.');
    }
  };

  const cardType = getCardType(card.number);

  const styles = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', background: '#f5f5f5' },
    navbar: { background: '#2d5a27', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navTitle: { fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' },
    stepper: { display: 'flex', justifyContent: 'center', gap: '20px', padding: '15px 0', fontWeight: 'bold', fontSize: '14px', background: 'white', borderBottom: '1px solid #eee' },
    main: { flex: 1, padding: '30px', display: 'flex', justifyContent: 'center' },
    twoCol: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '25px', width: '100%', maxWidth: '1000px' },
    leftCard: { background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    rightCard: { background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: 'fit-content' },
    title: { fontSize: '22px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '20px' },
    methodTabs: { display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' },
    methodTab: (active) => ({ padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', border: active ? '2px solid #2d5a27' : '2px solid #ddd', background: active ? '#e8f5e9' : 'white', color: active ? '#2d5a27' : '#777', display: 'flex', alignItems: 'center', gap: '6px' }),
    label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' },
    inputWrapper: { position: 'relative', marginBottom: '15px' },
    input: { width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
    inputIcon: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 'bold' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    btnPay: { width: '100%', background: loading ? '#aaa' : '#2d5a27', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    btnCancel: { width: '100%', background: 'white', color: '#999', border: '1px solid #ddd', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '10px' },
    error: { background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' },
    summaryTitle: { fontSize: '16px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '15px' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#777', marginBottom: '8px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#2d5a27', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #eee' },
    addressBlock: { fontSize: '13px', color: '#555', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee', lineHeight: '1.6' },
    methodNote: { background: '#f9f9f9', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#777', fontSize: '14px', marginBottom: '15px' },
  };

  // Card flip styles
  const cardFlipStyle = {
    perspective: '1000px',
    marginBottom: '20px',
    height: '180px',
  };

  const cardInnerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const cardFaceStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: '15px',
    padding: '20px',
    boxSizing: 'border-box',
    color: 'white',
    background: cardType.gradient,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  };

  if (success) {
    return (
      <div style={styles.container}>
        <nav style={styles.navbar}>
          <div style={styles.navTitle} onClick={() => navigate('/')}>🌱 GreenRoot</div>
        </nav>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '50px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '10px' }}>Payment Successful!</h2>
            <p style={{ color: '#777', marginBottom: '5px' }}>Your order has been placed successfully.</p>
            <p style={{ color: '#777', marginBottom: '20px' }}>A confirmation email has been sent to you.</p>
            <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '15px', marginBottom: '20px', fontSize: '13px', color: '#2d5a27' }}>
              🚚 Estimated Delivery: 1-3 Business Days<br />
              📧 Check your email for order details
            </div>
            <div style={{ fontSize: '13px', color: '#999' }}>Redirecting to dashboard in 5 seconds...</div>
            <button style={{ ...styles.btnPay, marginTop: '20px' }} onClick={() => navigate('/consumer')}>
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navTitle} onClick={() => navigate('/')}>🌱 GreenRoot</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px', color: 'white' }}>
          <span>🔒 Secure Payment</span>
        </div>
      </nav>

      <div style={styles.stepper}>
        <span style={{ color: '#999' }}>🛒 Cart</span>
        <span style={{ color: '#999' }}>→</span>
        <span style={{ color: '#2d5a27' }}>💳 Payment</span>
        <span style={{ color: '#999' }}>→</span>
        <span style={{ color: '#999' }}>✅ Complete</span>
      </div>

      <div style={styles.main}>
        <div style={styles.twoCol}>

          {/* LEFT - Payment Form */}
          <div style={styles.leftCard}>
            <div style={styles.title}>🔒 Secure Payment</div>

            {/* Payment Method Tabs */}
            <div style={styles.methodTabs}>
              {[
                { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
                { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
              ].map(m => (
                <div key={m.id} style={styles.methodTab(paymentMethod === m.id)} onClick={() => setPaymentMethod(m.id)}>
                  {m.icon} {m.label}
                </div>
              ))}
            </div>

            {error && <div style={styles.error}>⚠️ {error}</div>}

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <>
                {/* Card Flip */}
                <div style={cardFlipStyle}>
                  <div style={cardInnerStyle}>
                    {/* Front */}
                    <div style={cardFaceStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>🌱 GreenRoot Pay</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{cardType.symbol}</span>
                      </div>
                      <div style={{ fontSize: '20px', letterSpacing: '3px', marginBottom: '20px', fontFamily: 'monospace' }}>
                        {card.number || '•••• •••• •••• ••••'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <div>
                          <div style={{ opacity: 0.7, fontSize: '10px' }}>CARD HOLDER</div>
                          <div>{card.name || 'YOUR NAME'}</div>
                        </div>
                        <div>
                          <div style={{ opacity: 0.7, fontSize: '10px' }}>EXPIRES</div>
                          <div>{card.expiry || 'MM/YY'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div style={{ ...cardFaceStyle, transform: 'rotateY(180deg)' }}>
                      <div style={{ background: 'rgba(0,0,0,0.3)', height: '40px', margin: '20px -20px', marginTop: '10px' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                        <span style={{ fontSize: '12px', opacity: 0.8 }}>CVV</span>
                        <div style={{ background: 'white', color: '#333', borderRadius: '4px', padding: '5px 15px', fontFamily: 'monospace', letterSpacing: '3px' }}>
                          {card.cvv || '•••'}
                        </div>
                      </div>
                      <div style={{ marginTop: '20px', fontSize: '11px', opacity: 0.7, textAlign: 'center' }}>
                        This card is issued by GreenRoot Payment Services
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cardholder Name */}
                <label style={styles.label}>Cardholder Name</label>
                <div style={styles.inputWrapper}>
                  <input name="name" value={card.name} onChange={handleChange} placeholder="John Silva" style={styles.input} />
                </div>

                {/* Card Number */}
                <label style={styles.label}>Card Number</label>
                <div style={styles.inputWrapper}>
                  <input name="number" value={card.number} onChange={handleChange} placeholder="1234 5678 9012 3456" style={{ ...styles.input, paddingRight: '60px' }} />
                  <span style={styles.inputIcon}>
                    {cardType.type === 'Visa' && <span style={{ color: '#1a1f71', fontWeight: 'bold' }}>VISA</span>}
                    {cardType.type === 'Mastercard' && <span style={{ color: '#eb001b', fontWeight: 'bold' }}>MC</span>}
                    {cardType.type === 'Amex' && <span style={{ color: '#007bc1', fontWeight: 'bold' }}>AMEX</span>}
                    {!cardType.type && <span>💳</span>}
                  </span>
                </div>
                {card.number && (
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: card.number.replace(/\s/g, '').length === 16 ? (isValidCardNumber(card.number) ? cardType.color : '#e53935') : '#999', marginTop: '-10px', marginBottom: '10px' }}>
                    {card.number.replace(/\s/g, '').length === 16 ? (isValidCardNumber(card.number) ? `✅ Valid ${cardType.type || ''} card` : '❌ Invalid card number') : (cardType.type ? `💳 ${cardType.type} detected` : '❓ Unknown card type')}
                  </div>
                )}

                {/* Expiry + CVV */}
                <div style={styles.row}>
                  <div>
                    <label style={styles.label}>Expiry Date</label>
                    <div style={styles.inputWrapper}>
                      <input name="expiry" value={card.expiry} onChange={handleChange} placeholder="MM/YY" style={styles.input} />
                    </div>
                  </div>
                  <div>
                    <label style={styles.label}>CVV {getCardType(card.number).type === 'Amex' ? '(4 digits)' : '(3 digits)'}</label>
                    <div style={styles.inputWrapper}>
                      <input name="cvv" value={card.cvv} onChange={handleChange} placeholder={getCardType(card.number).type === 'Amex' ? '1234' : '123'} type="password"
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => setIsFlipped(false)}
                        style={styles.input} />
                    </div>
                  </div>
                </div>

                {/* Card Brands */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '12px', marginBottom: '10px' }}>
                  <span style={{ color: '#1a1f71', fontWeight: 'bold' }}>VISA</span>
                  <span>•</span>
                  <span style={{ color: '#eb001b', fontWeight: 'bold' }}>Mastercard</span>
                  <span>•</span>
                  <span style={{ color: '#007bc1', fontWeight: 'bold' }}>Amex</span>
                  <span>•</span>
                  <span>🔒 SSL Secured</span>
                </div>
              </>
            )}



            {/* COD */}
            {paymentMethod === 'cod' && (
              <div style={styles.methodNote}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>💵</div>
                <div style={{ fontWeight: 'bold', color: '#2d5a27', marginBottom: '5px' }}>Cash on Delivery</div>
                <p style={{ fontSize: '13px' }}>Pay cash when your order is delivered.</p>
                <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px', marginTop: '10px', fontSize: '13px', color: '#e65100' }}>
                  ⚠️ Please have exact change of <strong>Rs. {grandTotal}</strong> ready.
                </div>
              </div>
            )}

            {/* Loading Spinner */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #eee', borderTop: '3px solid #2d5a27', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ marginLeft: '10px', color: '#2d5a27', fontSize: '14px' }}>Processing payment...</span>
              </div>
            )}

            <button style={styles.btnPay} onClick={handlePay} disabled={loading}>
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Processing...
                </>
              ) : (
                `Pay Rs. ${grandTotal}`
              )}
            </button>
            <button style={styles.btnCancel} onClick={() => navigate('/consumer')}>Cancel</button>
          </div>

          {/* RIGHT - Order Summary */}
          <div style={styles.rightCard}>
            <div style={styles.summaryTitle}>📋 Order Summary</div>

            {isCart && cartItems ? (
              cartItems.map(item => (
                <div key={item._id} style={styles.summaryRow}>
                  <span>{item.name}{item.subCategory ? ` (${item.subCategory})` : ''} x {item.cartQuantity}kg</span>
                  <span>Rs. {item.price * item.cartQuantity}</span>
                </div>
              ))
            ) : (
              <>
                <div style={styles.summaryRow}>
                  <span>Product</span>
                  <span style={{ fontWeight: 'bold' }}>{productName}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span>Quantity</span>
                  <span>{quantity} kg</span>
                </div>
              </>
            )}

            <div style={styles.totalRow}>
              <span>Total (incl. delivery)</span>
              <span>Rs. {grandTotal}</span>
            </div>

            {deliveryAddress && typeof deliveryAddress === 'object' && (
              <div style={styles.addressBlock}>
                <div style={{ fontWeight: 'bold', color: '#2d5a27', marginBottom: '6px' }}>🚚 Delivery Address</div>
                <div>{deliveryAddress.fullName}</div>
                <div>{deliveryAddress.addressLine1}{deliveryAddress.addressLine2 ? `, ${deliveryAddress.addressLine2}` : ''}</div>
                <div>{deliveryAddress.city}, {deliveryAddress.district} {deliveryAddress.postalCode}</div>
                <div>📞 {deliveryAddress.phone}</div>
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '10px', fontSize: '12px', color: '#2d5a27', textAlign: 'center' }}>
              🔒 SSL Encrypted Payment<br />
              🌱 GreenRoot — Farm to Consumer
            </div>
          </div>

        </div>
      </div>

      {/* 3D Secure / OTP Verification Modal */}
      {showOtpModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'white', borderRadius: '15px', padding: '30px',
            width: '400px', maxWidth: '90%', textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '10px' }}>
              Secure Payment Verification
            </h3>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>
              We have sent a 6-digit One-Time Password (OTP) to your registered email address. Please enter it below to authorize the payment.
            </p>
            {otpError && (
              <div style={{
                background: otpError.includes('sent') ? '#e8f5e9' : '#ffebee',
                color: otpError.includes('sent') ? '#2d5a27' : '#c62828',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '15px'
              }}>
                {otpError.includes('sent') ? '✅' : '⚠️'} {otpError}
              </div>
            )}
            <input
              type="text"
              placeholder="••••••"
              value={otpCode}
              disabled={loading}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                width: '100%', padding: '12px', fontSize: '24px',
                textAlign: 'center', letterSpacing: '8px', fontWeight: 'bold',
                borderRadius: '8px', border: '2px solid #2d5a27', outline: 'none',
                marginBottom: '20px', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                disabled={loading}
                onClick={async () => {
                  if (!/^\d{6}$/.test(otpCode)) {
                    setOtpError('Please enter a valid 6-digit OTP code.');
                    return;
                  }
                  setOtpError('');
                  try {
                    setLoading(true);
                    await verifyOTP(otpCode, token);
                    setShowOtpModal(false);
                    await processOrderPayment();
                  } catch (err) {
                    setOtpError(err.response?.data?.message || 'Invalid or expired OTP code.');
                    setLoading(false);
                  }
                }}
                style={{
                  flex: 1, background: '#2d5a27', color: 'white', border: 'none',
                  padding: '12px', borderRadius: '8px', fontSize: '14px',
                  fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Pay'}
              </button>
              <button
                disabled={loading}
                onClick={() => setShowOtpModal(false)}
                style={{
                  flex: 1, background: 'white', color: '#777', border: '1px solid #ddd',
                  padding: '12px', borderRadius: '8px', fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{ marginTop: '20px', fontSize: '13px', color: '#777' }}>
              Didn't receive the email?{' '}
              <span
                onClick={resending || loading ? null : handleResendOtp}
                style={{
                  color: resending || loading ? '#aaa' : '#2d5a27',
                  textDecoration: 'underline',
                  cursor: resending || loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Payment;