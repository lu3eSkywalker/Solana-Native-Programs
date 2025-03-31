import * as borsh from "borsh";

// Define the counter schema correctly
export class CounterAccount {
    count: number;
  
    constructor({count}: {count: number}) {
      this.count = count;
    }
  }

export const schema = { struct: { count: 'u32'}};
  
// Calculate the space required for the account
export const COUNTER_SIZE = borsh.serialize(schema, new CounterAccount({count: 0})).length;