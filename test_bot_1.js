import ora from 'ora'
import React from 'react';
import { render, Text } from 'ink';
import Spinner from 'ink-spinner';


async function main(){

  // async function delay1(ms){
  //   new Promise(res => {
  //     let spinner1 = ora({
  //       text: "Fetching Balances...",
  //       spinner: 'line',
  //       color: 'red',
  //       indent: 3,
  //     }).start();
  //     setTimeout(()=>{spinner1.succeed("yeah");res(Date.now())}, ms)
  //   })
  // };

  // async function delay2(ms){
  //   new Promise(res => {
  //     let spinner2 = ora({
  //       text: "Fetching Balances...",
  //       spinner: 'line',
  //       color: 'red',
  //       indent: 3,
  //     }).start();
  //     setTimeout(()=>{spinner2.succeed("yeah");res(Date.now())}, ms)
  //   })
  // };

  // async function delay3(ms){
  //   new Promise(res => {
  //     let spinner3 = ora({
  //       text: "Fetching Balances...",
  //       spinner: 'line',
  //       color: 'red',
  //       indent: 3,
  //     }).start();
  //     setTimeout(()=>{spinner3.succeed("yeah");res(Date.now())}, ms)
  //   })
  // };
  // let arr = []
  // let one = delay1(2000)
  // let two = delay2(2000)
  // let three = delay3(4000)

  // arr.push(one, two, three)
  // let res = await Promise.allSettled(arr)
  // console.log(res)


  
  render(
    <Text>
      <Text color="green">
        <Spinner type="dots" />
      </Text>
      {' Loading'}
    </Text>
  );
}
main()