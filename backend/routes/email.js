const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
  }
});

// Send order confirmation to consumer
const sendOrderConfirmation = async (consumerEmail, orderDetails) => {
  try {
    await transporter.sendMail({
      from: `"🌱 GreenRoot" <${process.env.EMAIL_USER}>`,
      to: consumerEmail,
      subject: '✅ Order Confirmed - GreenRoot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2d5a27; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🌱 GreenRoot</h1>
            <p>Farm to Consumer Marketplace</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #2d5a27;">✅ Order Confirmed!</h2>
            <p>Dear <strong>${orderDetails.consumerName}</strong>,</p>
            <p>Your order has been successfully placed!</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #2d5a27;">Order Details</h3>
             ${orderDetails.cartSummary && orderDetails.cartSummary.length > 0 ? 
              orderDetails.cartSummary.map(item => 
                `<p>📦 <strong>${item.name}${item.subCategory ? ` (${item.subCategory})` : ''}</strong> — ${item.quantity}kg — Rs. ${item.price}</p>`
              ).join('') 
            : `<p>📦 Product: <strong>${orderDetails.productName}${orderDetails.subCategory ? ` (${orderDetails.subCategory})` : ''}</strong></p>
              <p>⚖️ Quantity: <strong>${orderDetails.quantity} kg</strong></p>`
            }
                          <p>💰 Subtotal: <strong>Rs. ${orderDetails.totalAmount - (orderDetails.deliveryFee || 0)}</strong></p>
              <p>🚚 Delivery Fee: <strong>Rs. ${orderDetails.deliveryFee || 450}</strong></p>
              <p>💰 Total Amount: <strong>Rs. ${orderDetails.totalAmount}</strong></p>
              <p>🏠 Delivery Address: <strong>${typeof orderDetails.deliveryAddress === 'object'
    ? `${orderDetails.deliveryAddress.addressLine1 || ''},${orderDetails.deliveryAddress.addressLine2 || ''}, ${orderDetails.deliveryAddress.city || ''}, ${orderDetails.deliveryAddress.district || ''} ${orderDetails.deliveryAddress.postalCode || ''}`
    : orderDetails.deliveryAddress || 'N/A'
              }</strong></p>
                            <p>💳 Payment Method: <strong>${
                orderDetails.paymentMethod === 'card' ? 'Credit/Debit Card' :
                orderDetails.paymentMethod === 'bank' ? 'Bank Transfer' :
                orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'
              }</strong></p>

              ${orderDetails.paymentMethod === 'bank' ? `
              <div style="background: #fff3e0; padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 13px;">
                <strong>🏦 Bank Transfer Details:</strong><br/>
                Bank: Bank of Ceylon<br/>
                Account: GreenRoot (Pvt) Ltd<br/>
                Account No: 0123456789<br/>
                Reference: ${orderDetails.consumerName} - Use your Order ID
              </div>
              ` : ''}

              ${orderDetails.paymentMethod === 'cod' ? `
              <div style="background: #fff3e0; padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 13px;">
                <strong>💵 Cash on Delivery:</strong> Please have exact change ready when your order arrives.
              </div>
              ` : ''}


              <p>🧑‍🌾 Farmer: <strong>${orderDetails.farmerName}</strong></p>
              <p>📅 Date: <strong>${new Date().toLocaleDateString()}</strong></p>
            </div>
            <p style="color: #777;">Your order is being processed. You will receive updates as the status changes.</p>
          </div>
          <div style="background: #2d5a27; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
            <p>© 2024 GreenRoot. All rights reserved.</p>
          </div>
        </div>
      `
    });
    console.log('Order confirmation email sent!');
  } catch (err) {
    console.log('Email error:', err.message);
  }
};

// Send order notification to farmer
const sendFarmerNotification = async (farmerEmail, orderDetails) => {
  try {
    await transporter.sendMail({
      from: `"🌱 GreenRoot" <${process.env.EMAIL_USER}>`,
      to: farmerEmail,
      subject: '🛒 New Order Received - GreenRoot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2d5a27; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🌱 GreenRoot</h1>
            <p>Farm to Consumer Marketplace</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #2d5a27;">🛒 New Order Received!</h2>
            <p>Dear <strong>${orderDetails.farmerName}</strong>,</p>
            <p>You have received a new order!</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #2d5a27;">Order Details</h3>
              ${orderDetails.cartSummary && orderDetails.cartSummary.length > 0 ?
              orderDetails.cartSummary.map(item =>
                `<p>📦 <strong>${item.name}${item.subCategory ? ` (${item.subCategory})` : ''}</strong> — ${item.quantity}kg — Rs. ${item.price}</p>`
              ).join('')
            : `<p>📦 Product: <strong>${orderDetails.productName}${orderDetails.subCategory ? ` (${orderDetails.subCategory})` : ''}</strong></p>
              <p>⚖️ Quantity: <strong>${orderDetails.quantity} kg</strong></p>`
            }
              <p>💰 Order Amount: <strong>Rs. ${orderDetails.totalAmount - (orderDetails.deliveryFee || 0)}</strong></p>
              <p>🏠 Delivery Address: <strong>${typeof orderDetails.deliveryAddress === 'object'
                    ? `${orderDetails.deliveryAddress.addressLine1 || ''},${orderDetails.deliveryAddress.addressLine2 || ''}, ${orderDetails.deliveryAddress.city || ''}, ${orderDetails.deliveryAddress.district || ''} ${orderDetails.deliveryAddress.postalCode || ''}`
                    : orderDetails.deliveryAddress || 'N/A'
                }</strong></p>
              <p>👤 Consumer: <strong>${orderDetails.consumerName}</strong></p>
              <p>📅 Date: <strong>${new Date().toLocaleDateString()}</strong></p>
            </div>
            <p style="color: #777;">Please process this order as soon as possible.</p>
          </div>
          <div style="background: #2d5a27; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
            <p>© 2024 GreenRoot. All rights reserved.</p>
          </div>
        </div>
      `
    });
    console.log('Farmer notification email sent!');
  } catch (err) {
    console.log('Email error:', err.message);
  }
};

// Send order status update to consumer
const sendStatusUpdate = async (consumerEmail, orderDetails) => {
  try {
    await transporter.sendMail({
      from: `"🌱 GreenRoot" <${process.env.EMAIL_USER}>`,
      to: consumerEmail,
      subject: `📦 Order Status Updated - ${orderDetails.status.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2d5a27; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🌱 GreenRoot</h1>
            <p>Farm to Consumer Marketplace</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #2d5a27;">📦 Order Status Updated!</h2>
            <p>Dear <strong>${orderDetails.consumerName || 'Valued Customer'}</strong>,</p>
            <p>Your order status has been updated to: 
              <strong style="color: ${
                orderDetails.status === 'delivered' ? '#2d5a27' : 
                orderDetails.status === 'cancelled' ? '#e53935' : '#1976d2'
              }">
                ${orderDetails.status.toUpperCase()}
              </strong>
            </p>

            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #2d5a27; margin-bottom: 15px;">📋 Order Details</h3>
              <p>🆔 Order ID: <strong>#${orderDetails.orderId || 'N/A'}</strong></p>
              <p>📦 Product: <strong>${orderDetails.productName}${orderDetails.subCategory ? ` (${orderDetails.subCategory})` : ''}</strong></p>
              <p>⚖️ Quantity: <strong>${orderDetails.quantity} kg</strong></p>
              <p>💰 Total Amount: <strong>Rs. ${orderDetails.totalAmount}</strong></p>
              <p>🧑‍🌾 Farmer: <strong>${orderDetails.farmerName || 'N/A'}</strong></p>
              <p>🏠 Delivery Address: <strong>${
                typeof orderDetails.deliveryAddress === 'object'
                  ? `${orderDetails.deliveryAddress.addressLine1 || ''},${orderDetails.deliveryAddress.addressLine2 || ''}, ${orderDetails.deliveryAddress.city || ''}, ${orderDetails.deliveryAddress.district || ''} ${orderDetails.deliveryAddress.postalCode || ''}`
                  : orderDetails.deliveryAddress || 'N/A'
              }</strong></p>
              <p>📅 Date: <strong>${new Date().toLocaleDateString()}</strong></p>
            </div>

            ${orderDetails.status === 'delivered' ? `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 5px solid #2d5a27;">
              <p style="color: #2d5a27; margin: 0;">✅ Your order has been delivered! Thank you for shopping with GreenRoot. We hope you enjoy your fresh produce!</p>
            </div>
            ` : ''}

            ${orderDetails.status === 'processing' ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 5px solid #1976d2;">
              <p style="color: #1976d2; margin: 0;">🚚 Your order is being processed by the farmer. It will be delivered to you soon!</p>
            </div>
            ` : ''}

            ${orderDetails.status === 'cancelled' ? `
            <div style="background: #ffebee; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 5px solid #e53935;">
              <p style="color: #e53935; margin: 0;">❌ Your order has been cancelled. If you have any concerns, please contact us.</p>
            </div>
            ` : ''}

            <p style="color: #777; margin-top: 20px;">Thank you for choosing GreenRoot — connecting you directly with local farmers!</p>
          </div>
          <div style="background: #2d5a27; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
            <p>© 2024 GreenRoot. All rights reserved.</p>
            <p style="font-size: 12px; color: #a5d6a7;">Farm Fresh • Direct from Farmers • Delivered to You</p>
          </div>
        </div>
      `
    });
    console.log('Status update email sent!');
  } catch (err) {
    console.log('Email error:', err.message);
  }
};
// Send cancellation email to farmer
const sendFarmerCancellationNotification = async (farmerEmail, orderDetails) => {
  try {
    await transporter.sendMail({
      from: `"🌱 GreenRoot" <${process.env.EMAIL_USER}>`,
      to: farmerEmail,
      subject: `❌ Order Cancelled by Customer - GreenRoot`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #e53935; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🌱 GreenRoot</h1>
            <p>Order Cancellation Notice</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #c62828;">❌ An Order has been Cancelled</h2>
            <p>Dear <strong>${orderDetails.farmerName}</strong>,</p>
            <p>We regret to inform you that the customer has cancelled their order.</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #c62828; margin-bottom: 15px;">📋 Order Details</h3>
              <p>🆔 Order ID: <strong>#${orderDetails.orderId}</strong></p>
              <p>📦 Product: <strong>${orderDetails.productName}${orderDetails.subCategory ? ` (${orderDetails.subCategory})` : ''}</strong></p>
              <p>⚖️ Quantity: <strong>${orderDetails.quantity} kg</strong></p>
              <p>💰 Order Amount: <strong>Rs. ${orderDetails.totalAmount - (orderDetails.deliveryFee || 0)}</strong></p>
              <p>👤 Customer: <strong>${orderDetails.consumerName}</strong></p>
              <p>📅 Date: <strong>${new Date().toLocaleDateString()}</strong></p>
            </div>
            <p style="color: #777;">The stock for this order has been automatically restored to your inventory batches.</p>
          </div>
          <div style="background: #2d5a27; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
            <p>© 2024 GreenRoot. All rights reserved.</p>
          </div>
        </div>
      `
    });
    console.log('Farmer cancellation email sent!');
  } catch (err) {
    console.log('Email error:', err.message);
  }
};
// Send OTP to customer email
const sendOTPEmail = async (consumerEmail, otp) => {
  try {
    await transporter.sendMail({
      from: `"🌱 GreenRoot" <${process.env.EMAIL_USER}>`,
      to: consumerEmail,
      subject: '🔑 Your GreenRoot Payment OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: #2d5a27; color: white; padding: 20px; text-align: center;">
            <h1>🌱 GreenRoot</h1>
            <p>Secure Payment Verification</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9; text-align: center;">
            <h2 style="color: #2d5a27;">Your One-Time Password (OTP)</h2>
            <p style="font-size: 16px; color: #555;">Please use the following 6-digit One-Time Password to complete your payment. This OTP is valid for 5 minutes.</p>
            <div style="background: white; border: 2px dashed #2d5a27; display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: bold; color: #2d5a27; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #999;">If you did not request this code, please ignore this email or contact support if you suspect unauthorized activity.</p>
          </div>
          <div style="background: #2d5a27; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2026 GreenRoot. All rights reserved.</p>
          </div>
        </div>
      `
    });
    console.log('OTP email sent to:', consumerEmail);
  } catch (err) {
    console.log('OTP Email error:', err.message);
    throw err;
  }
};

// Send Forgot Password OTP to user email
const sendForgotPasswordOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"🌱 GreenRoot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔑 Reset Password OTP - GreenRoot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: #2d5a27; color: white; padding: 20px; text-align: center;">
            <h1>🌱 GreenRoot</h1>
            <p>Verification Code</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9; text-align: center;">
            <h2 style="color: #2d5a27;">Your Verification Code (OTP)</h2>
            <p style="font-size: 16px; color: #555;">Please use the following 6-digit One-Time Password to log in. This OTP is valid for 5 minutes.</p>
            <div style="background: white; border: 2px dashed #2d5a27; display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: bold; color: #2d5a27; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #999;">If you did not request this code, please ignore this email.</p>
          </div>
          <div style="background: #2d5a27; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2026 GreenRoot. All rights reserved.</p>
          </div>
        </div>
      `
    });
    console.log('Forgot password OTP email sent to:', email);
  } catch (err) {
    console.log('Forgot password OTP Email error:', err.message);
    throw err;
  }
};

module.exports = { sendOrderConfirmation, sendFarmerNotification, sendStatusUpdate, sendFarmerCancellationNotification, sendOTPEmail, sendForgotPasswordOTPEmail };