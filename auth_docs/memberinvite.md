curl -X 'POST' \
  'https://dev.kaha.com.np/agencies/owner/members/invite' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "full_name": "string",
  "phone": "string",
  "role": "staff"
}'
Requestpay load
{
  "full_name": "string",
  "phone": "string",
  "role": "staff"
}
Response payload 

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "phone": "string",
  "role": "string",
  "dev_password": "string"
}
