require('dotenv/config');
const Fastify = require('fastify');
const { performLogin } = require('../worker/login');
const fs = require('fs');
const path = require('path');

const app = Fastify({
    logger: true,
    // optional: trust proxy, etc.
});

// Simple health
app.get('/health', async () => ({ ok: true }));

// Function to check login status
async function checkLoginStatus(email) {
    if (!email) return { isLoggedIn: false, needsLogin: true };

    const cookieFileName = `cookies-${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const cookiePath = path.join(__dirname, '..', 'data', 'cookies', cookieFileName);

    if (!fs.existsSync(cookiePath)) {
        return { isLoggedIn: false, needsLogin: true };
    }

    try {
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
        // Simple check: if cookies exist, we assume the user is logged in
        return { isLoggedIn: cookies.length > 0, needsLogin: cookies.length === 0 };
    } catch (error) {
        return { isLoggedIn: false, needsLogin: true };
    }
}

// POST /auth/login
// Body options: { email?, password?, wsEndpoint?, executablePath?, saveAs? }
app.post('/auth/login', {
    schema: {
        body: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                password: { type: 'string' },
                wsEndpoint: { type: 'string' },
                executablePath: { type: 'string' },
                saveAs: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
}, async (req, reply) => {
    try {
        const {
            email,
            password,
            wsEndpoint,
            executablePath,
            saveAs,
        } = req.body || {};

        // First check the login status
        const loginStatus = await checkLoginStatus(email);

        if (loginStatus.needsLogin) {
            // If not logged in, automatically perform login
            const result = await performLogin({
                email,
                password,
                wsEndpoint,
                executablePath,
                saveAs,
            });

            if (result.ok) {
                return reply.send({
                    status: 'login_initiated',
                    message: 'wait for 30 sec',
                    loggedIn: result.loggedIn,
                    didSubmit: result.didSubmit,
                    cookiesSavedTo: result.cookieFile,
                    autoLogin: true
                });
            } else {
                return reply.status(400).send({
                    status: 'login_failed',
                    message: 'Automatic login failed',
                    error: result.error,
                    autoLogin: true
                });
            }
        } else {
            // Already logged in
            return reply.send({
                status: 'already_logged_in',
                message: 'User is already logged in',
                loggedIn: true,
                autoLogin: false
            });
        }
    } catch (err) {
        req.log.error({ err }, 'login failed');
        return reply.status(500).send({
            status: 'error',
            message: err.message || 'Login failed',
        });
    }
});

// New endpoint to check login status
app.get('/auth/status/:email', async (req, reply) => {
    try {
        const { email } = req.params;
        const loginStatus = await checkLoginStatus(email);

        return reply.send({
            email,
            isLoggedIn: loginStatus.isLoggedIn,
            needsLogin: loginStatus.needsLogin
        });
    } catch (err) {
        req.log.error({ err }, 'status check failed');
        return reply.status(500).send({
            status: 'error',
            message: err.message || 'Status check failed',
        });
    }
});

const PORT = process.env.PORT || 87;
app.listen({ port: Number(PORT), host: '0.0.0.0' })
    .then(() => console.log(`API listening on http://localhost:${PORT}`))
    .catch((e) => {
        console.error('Failed to start server', e);
        process.exit(1);
    });
