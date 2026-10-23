FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

RUN apt-get update && apt-get install -y curl

CMD ["flask", "--app", "app.py", "run", "--host=0.0.0.0", "--port=5000", "--debug"]