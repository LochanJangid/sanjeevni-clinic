from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"msg": "Welcome to sanjeevni clinic API side :]"}

@app.post("/user_registration/")
def user_registration(user):
    return {"Registration": user}

@app.post("/user_login/")
def user_login(user):
    return {"Log in ": user}