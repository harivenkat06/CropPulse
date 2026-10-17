import { Request, Response } from 'express';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export const getPredictionCatalog = async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/catalog`);
    if (!response.ok) {
      console.error('ML catalog service error:', await response.text());
      res.status(503).json({ error: 'Prediction catalog is unavailable' });
      return;
    }

    res.status(200).json(await response.json());
  } catch (error) {
    console.error('Failed to load prediction catalog:', error);
    res.status(503).json({ error: 'Prediction catalog is unavailable' });
  }
};

export const getPrediction = async (req: Request, res: Response) => {
  try {
    const { cropId, marketId, horizon } = req.query;

    if (!cropId || !marketId) {
      res.status(400).json({ error: 'cropId and marketId are required parameters' });
      return;
    }

    const requestedHorizon = horizon ? parseInt(horizon as string) : 7; // default to 7 days if not specified

    // Fetch prediction from ML service
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop_id: cropId,
        market_id: marketId,
        horizon: requestedHorizon,
      }),
    });

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      console.error('ML Service Error:', errText);
      res.status(500).json({ error: 'ML Prediction Service returned an error' });
      return;
    }

    const data = await mlResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Failed to communicate with prediction service:', error);
    // If the ML service is down, we return a clear user friendly message instead of crashing
    res.status(503).json({
      error: 'Prediction service is temporarily unavailable. Please try again later.',
    });
  }
};

export const triggerTraining = async (req: Request, res: Response) => {
  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/train`, {
      method: 'POST',
    });

    if (!mlResponse.ok) {
      res.status(500).json({ error: 'ML Prediction Service failed to train' });
      return;
    }

    const data = await mlResponse.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(503).json({ error: 'ML Prediction Service is unreachable' });
  }
};
