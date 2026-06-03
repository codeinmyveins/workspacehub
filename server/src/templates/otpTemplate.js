function otpTemplate(otp) {
    return `
        <p style="color: #333; font-size: 16px;">Your OTP is: <span style="font-weight: bold; border: 1px solid #be9191; padding: 10px;">${otp}</span></p>
    `
};

module.exports = otpTemplate;