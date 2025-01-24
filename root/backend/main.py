import uvicorn
import dotenv
if __name__ == "__main__":
    dotenv.load_dotenv()
    uvicorn.run("app.app:app", host="0.0.0.0", port=8080, log_level="info")
