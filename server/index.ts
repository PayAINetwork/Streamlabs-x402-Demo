import { config } from "dotenv";
import express from "express";
import axios from "axios";
import { paymentMiddleware, Resource, Network, type SolanaAddress } from "x402-express";
import cors from "cors";
config();

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}`;
const network = process.env.NETWORK as Network;

// Solana configuration
const solanaTreasuryAddress = process.env.SOLANA_TREASURY_ADDRESS as SolanaAddress;

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(
  paymentMiddleware(
    payTo,
    {
      "POST /1-dollar": {
        price: "$1",
        network,
      },
      "POST /5-dollar": {
        price: "$5",
        network,
      }
      ,"POST /10-dollar": {
        price: "$10",
        network,
      }
      ,"POST /20-dollar": {
        price: "$20",
        network,
      }
      ,"POST /50-dollar": {
        price: "$50",
        network,
      }
      ,"POST /100-dollar": {
        price: "$100",
        network,
      }
    },
    {
      url: facilitatorUrl,
    },
  ),
);

//make a function that can be called in all of my donation endpoints that makes the api call to streamlabs
const makeStreamlabsApiCall = async (amount: number, name: string, identifier: string, message: string) => {
  await axios.post("https://streamlabs.com/api/v2.0/donations", {
    name: name,
    message: message || null,
    identifier: identifier,
    amount: amount,
    currency: "USD"
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${process.env.STREAMLABS_TOKEN}`
    }
  });
}

app.post("/1-dollar", async (req, res) => {
  const { amount, name, identifier, message } = req.body;
  try {
    if (!amount || !name) {
      return res.status(400).send({message: "A donation amount and name are required"});
    }

    await makeStreamlabsApiCall(amount, name, identifier, message);
    console.log("Donation successful");
    return res.status(200).send({message: "Donation successful"});
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({message: "An error occurred"});
  }});
  
app.post("/5-dollar", async (req, res) => {
  const { amount, name, identifier, message } = req.body;
  try {
    if (!amount || !name) {
      return res.status(400).send({message: "A donation amount and name are required"});
    }

    await makeStreamlabsApiCall(amount, name, identifier, message);
    console.log("Donation successful");
    return res.status(200).send({message: "Donation successful"});
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({message: "An error occurred"});
}});

app.post("/10-dollar", async (req, res) => {
  const { amount, name, identifier, message } = req.body;
  try {
    if (!amount || !name) {
      return res.status(400).send({message: "A donation amount and name are required"});
    }

    await makeStreamlabsApiCall(amount, name, identifier, message);
    return res.status(200).send({message: "Donation successful"});
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({message: "An error occurred"});
}});

app.post("/20-dollar", async (req, res) => {
  const { amount, name, identifier, message } = req.body;
  try {
    if (!amount || !name) {
      return res.status(400).send({message: "A donation amount and name are required"});
    }

    await makeStreamlabsApiCall(amount, name, identifier, message);
    return res.status(200).send({message: "Donation successful"});
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({message: "An error occurred"});
}});

app.post("/50-dollar", async (req, res) => {
  const { amount, name, identifier, message } = req.body;
  try {
    if (!amount || !name) {
      return res.status(400).send({message: "A donation amount and name are required"});
    }

    await makeStreamlabsApiCall(amount, name, identifier, message);
    return res.status(200).send({message: "Donation successful"});
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({message: "An error occurred"});
}});

app.post("/100-dollar", async (req, res) => {
  const { amount, name, identifier, message } = req.body;
  try {
    if (!amount || !name) {
      return res.status(400).send({message: "A donation amount and name are required"});
    }

    await makeStreamlabsApiCall(amount, name, identifier, message);
    return res.status(200).send({message: "Donation successful"});
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({message: "An error occurred"});
}});

app.get("/get-streamer-info", async (req, res) => {
try{
  //make api call to streamlabs to get the streamer info
  const response = await axios.get("https://streamlabs.com/api/v2.0/user", {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.STREAMLABS_TOKEN}`
    }
  });
  return res.status(200).json(response.data);
} catch (error) {
  console.error(error);
  return res.status(500).send({message: "An error occurred"});
}
});

// create streamlabs api call logic here

// ========================================
// Solana Payment Endpoints
// ========================================

if (solanaX402) {
  // Helper function to create Solana payment requirements
  const createSolanaPaymentRequirements = async (amount: number) => {
    const usdcMintDevnet = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    const microAmount = (amount * 1_000_000).toString(); // Convert dollars to USDC micro-units
    const baseUrl = process.env.BASE_URL || "http://localhost:4021";

    return await solanaX402.createPaymentRequirements({
      price: {
        amount: microAmount,
        asset: {
          address: usdcMintDevnet,
          decimals: 6, // USDC has 6 decimals
        },
      },
      network: "solana-devnet",
      config: {
        description: `$${amount} donation`,
        resource: `${baseUrl}/solana/${amount}-dollar` as `${string}://${string}`,
      },
    });
  };

  // Solana payment endpoints
  app.post("/solana/1-dollar", async (req, res) => {
    try {
      const paymentHeader = solanaX402.extractPayment(req.headers);
      const paymentRequirements = await createSolanaPaymentRequirements(1);

      if (!paymentHeader) {
        const response = solanaX402.create402Response(paymentRequirements);
        return res.status(response.status).json(response.body);
      }

      const verified = await solanaX402.verifyPayment(paymentHeader, paymentRequirements);
      if (!verified) {
        return res.status(402).json({ error: "Invalid payment" });
      }

      const { amount, name, identifier, message } = req.body;
      if (amount && name) {
        await makeStreamlabsApiCall(amount, name, identifier, message);
      }

      await solanaX402.settlePayment(paymentHeader, paymentRequirements);
      return res.status(200).json({ message: "Payment successful" });
    } catch (error) {
      console.error("Solana payment error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  app.post("/solana/5-dollar", async (req, res) => {
    try {
      const paymentHeader = solanaX402.extractPayment(req.headers);
      const paymentRequirements = await createSolanaPaymentRequirements(5);

      if (!paymentHeader) {
        const response = solanaX402.create402Response(paymentRequirements);
        return res.status(response.status).json(response.body);
      }

      const verified = await solanaX402.verifyPayment(paymentHeader, paymentRequirements);
      if (!verified) {
        return res.status(402).json({ error: "Invalid payment" });
      }

      const { amount, name, identifier, message } = req.body;
      if (amount && name) {
        await makeStreamlabsApiCall(amount, name, identifier, message);
      }

      await solanaX402.settlePayment(paymentHeader, paymentRequirements);
      return res.status(200).json({ message: "Payment successful" });
    } catch (error) {
      console.error("Solana payment error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  app.post("/solana/10-dollar", async (req, res) => {
    try {
      const paymentHeader = solanaX402.extractPayment(req.headers);
      const paymentRequirements = await createSolanaPaymentRequirements(10);

      if (!paymentHeader) {
        const response = solanaX402.create402Response(paymentRequirements);
        return res.status(response.status).json(response.body);
      }

      const verified = await solanaX402.verifyPayment(paymentHeader, paymentRequirements);
      if (!verified) {
        return res.status(402).json({ error: "Invalid payment" });
      }

      const { amount, name, identifier, message } = req.body;
      if (amount && name) {
        await makeStreamlabsApiCall(amount, name, identifier, message);
      }

      await solanaX402.settlePayment(paymentHeader, paymentRequirements);
      return res.status(200).json({ message: "Payment successful" });
    } catch (error) {
      console.error("Solana payment error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  console.log("✅ Solana payment endpoints enabled");
} else {
  console.log("⚠️  Solana payment endpoints disabled (SOLANA_TREASURY_ADDRESS not set)");
}

app.listen(4021, () => {
  console.log(`Server listening at http://localhost:${4021}`);
});
