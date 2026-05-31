const passwordResetTemplate = (link) => {
    return `
        <h2>Reset Password</h2>
        <p>Click the link below to reset your workspacehub password !</p>
        <a href=${link}> <button style="background: cyan; color: black; padding:5px;">Reset Password</button> </a>
    `
};

module.exports = passwordResetTemplate;