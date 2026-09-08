CREATE UNIQUE INDEX "one_active_contract_per_boat"
ON "contracts" ("boat_id")
WHERE "end_datetime" IS NULL;
