FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY services/speech-stt/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/speech-stt/app ./app

ENV STT_MODEL_SIZE=small
ENV STT_DEVICE=cpu
ENV STT_COMPUTE_TYPE=int8

EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
