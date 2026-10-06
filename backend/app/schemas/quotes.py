from pydantic import BaseModel, ConfigDict

class QuoteOut(BaseModel):
    quote: str
    author: str
    category: str
    date: str
