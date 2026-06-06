import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="NeonSox Backend Core")

# Enable Cross-Origin Resource Sharing (CORS) so your local index.html file can securely pass data into Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the structure of the incoming data arriving from Kirk's browser window
class OnboardingPayload(BaseModel):
    business_info: str
    has_website: bool
    website_url: str

@app.post("/api/analyze")
def analyze_business(payload: OnboardingPayload):
    # Simulate data computation delay (NEONSOX Analysis Phase)
    time.sleep(2)
    
    # Process options dynamically based on whether Kirk has a website asset to draw from
    context_source = f"URL: {payload.website_url}" if payload.has_website else "Linked Social Profiles"
    
    # Generate the 3 deployment options to send back to the user interface
    return {
        "status": "success",
        "message": f"Analysis complete based on {context_source}",
        "options": [
            {
                "name": "Option 1: Pulse Starter Pack",
                "price": "$49"
            },
            {
                "name": "Option 2: Core Acceleration Array (Recommended)",
                "price": "$129"
            },
            {
                "name": "Option 3: Enterprise Velocity Matrix",
                "price": "$249"
            }
        ]
    }
