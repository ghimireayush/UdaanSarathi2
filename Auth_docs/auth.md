curl -X 'POST' \
  'https://dev.kaha.com.np/agency/register-owner' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "phone": "string",
  "full_name": "string"
}'

REquestpayload
{
  "phone": "string",
  "full_name": "string"
}

Responsepayload
{
  "dev_otp": "string"
}

