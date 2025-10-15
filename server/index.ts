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

// ========================================
// Solana Payment Endpoints
// ========================================

if (solanaTreasuryAddress) {
  app.use(
    paymentMiddleware(
      solanaTreasuryAddress,
      {
        "POST /solana/1-dollar": {
          price: "$1",
          network: "solana-devnet",
        },
        "POST /solana/5-dollar": {
          price: "$5",
          network: "solana-devnet",
        },
        "POST /solana/10-dollar": {
          price: "$10",
          network: "solana-devnet",
        },
        "POST /solana/20-dollar": {
          price: "$20",
          network: "solana-devnet",
        },
        "POST /solana/50-dollar": {
          price: "$50",
          network: "solana-devnet",
        },
        "POST /solana/100-dollar": {
          price: "$100",
          network: "solana-devnet",
        },
      },
      {
        url: facilitatorUrl,
      },
    ),
  );

  // Solana endpoint handlers
  app.post("/solana/1-dollar", async (req, res) => {
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
    }
  });

  app.post("/solana/5-dollar", async (req, res) => {
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
    }
  });

  app.post("/solana/10-dollar", async (req, res) => {
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
    }
  });

  app.post("/solana/20-dollar", async (req, res) => {
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
    }
  });

  app.post("/solana/50-dollar", async (req, res) => {
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
    }
  });

  app.post("/solana/100-dollar", async (req, res) => {
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
    }
  });

  console.log("✅ Solana payment endpoints enabled");
} else {
  console.log("⚠️  Solana payment endpoints disabled (SOLANA_TREASURY_ADDRESS not set)");
}

app.listen(4021, () => {
  console.log(`Server listening at http://localhost:${4021}`);
});
