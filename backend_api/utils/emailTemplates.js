exports.generateWelcomeEmail = (otp) => {
  const logoUrl = "https://crayai-five.vercel.app//crayfish.png";

  return `
    <div style="font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F6F9FC; border-radius: 8px;">
        
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="CrayAI Logo" style="height: 50px; width: auto; margin-bottom: 10px;" />
        </div>

        <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <h2 style="color: #0A2540; font-size: 22px; margin-top: 0; margin-bottom: 15px;">Verify your email address</h2>
            
            <p style="color: #556987; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Welcome to CrayAI! We are thrilled to have you on board. Please use the verification code below to complete your registration.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
                <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #008080; background-color: #E6F2F2; padding: 15px 30px; border-radius: 8px; border: 1px solid rgba(0, 128, 128, 0.2);">
                    ${otp}
                </span>
            </div>
            
            <p style="color: #556987; font-size: 14px; line-height: 1.6;">
                This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.
            </p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
            <p style="color: #9AA5B1; font-size: 12px;">
                &copy; 2026 CrayAI Systems. All rights reserved.<br>
                Developed by Students of TUP - Taguig Campus
            </p>
        </div>

    </div>
  `;
};