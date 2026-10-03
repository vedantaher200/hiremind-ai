import app from '../server/src/index.js';

export default (req: any, res: any) => {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('[API FATAL ERROR]', err);
    if (!res.headersSent) {
      return res.status(503).json({
        error: 'Service is temporarily unavailable. Please try again shortly.'
      });
    }
  }
};
