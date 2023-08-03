import express, {Request, Response} from 'express';
import {Twilio} from 'twilio';
import {load} from 'ts-dotenv';

const env = load({
  TW_SID: String,
  TW_VSID: String,
  TW_TOKEN: String,
});

const twilio: Twilio = new Twilio(env.TW_SID, env.TW_TOKEN);

export const verifyRouter = express.Router();

verifyRouter.use(express.json());

verifyRouter.post('/send', async (req: Request, res: Response) => {
  const number: string =
    req?.body?.number[0] === '+'
      ? req?.body?.number
      : (('+57' + req?.body?.number) as string);
  let verification;
  try {
    verification = await twilio.verify.v2
      .services(env.TW_VSID)
      .verifications.create({
        to: number,
        channel: 'sms',
      });
    if (verification.status === 'pending') {
      res.status(200).send({error: false, msg: 'The code has been sent!'});
    } else if (!verification.lookup.valid) {
      res
        .status(404)
        .send({error: true, msg: 'The phone number does not exist!'});
    } else {
      res
        .status(404)
        .send({error: true, msg: 'There was an error sending the code!'});
    }
  } catch (error: any) {
    console.log(error);
    if (error.status === 429) {
      return res.status(404).send({
        error: true,
        msg: 'Too many attempts, try again in 10 minutes!',
      });
    }
    res.status(404).send({error: true, msg: 'Unable to send the Twilio code!'});
  }
});

verifyRouter.post('/check', async (req: Request, res: Response) => {
  const number: string =
    req?.body?.number[0] === '+'
      ? req?.body?.number
      : (('+57' + req?.body?.number) as string);
  const code: string = req?.body?.code as string;
  console.log(number, code);
  let verification;
  try {
    verification = await twilio.verify.v2
      .services(env.TW_VSID)
      .verificationChecks.create({
        code: code,
        to: number,
      });
    console.log(verification);
    if (verification.status === 'approved') {
      res.status(200).send({error: false, msg: 'The code has been approved!'});
    } else {
      res.status(404).send({error: true, msg: 'Incorrect code!'});
    }
  } catch (error) {
    console.log(error);
    res.status(404).send({error: true, msg: 'Unable to send the code!'});
  }
});
