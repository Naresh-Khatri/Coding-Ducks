import { IStarterCode } from "../types";

export const LANGS_FOR_STARTER_CODE = [
  { label: "Python", value: "python" },
  { label: "Javascript", value: "javascript" },
  { label: "C++", value: "cpp" },
  // { label: "C", value: "c" },
  { label: "Java", value: "java" },
];

export const INITIAL_STARTER_CODES = [
  {
    langLabel: "Python",
    lang: "py",
    code: `#User function Template for python3


class Solution:
    def evenlyDivides (self, N):
        # code here


#{ 
 # Driver Code Starts
#Initial Template for Python 3

if __name__ == '__main__': 
    t = int (input ())
    for _ in range (t):
        N = int(input())
       

        ob = Solution()
        print(ob.evenlyDivides(N))
# } Driver Code Ends`,
  },
  {
    langLabel: "JavaScript",
    lang: "js",
    code: `//{ Driver Code Starts
//Initial Template for javascript

'use strict';

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString = '';
let currentLine = 0;

process.stdin.on('data', inputStdin => {
    inputString += inputStdin;
});

process.stdin.on('end', _ => {
    inputString = inputString.trim().split('\n').map(string => {
        return string.trim();
    });
    
    main();    
});

function readLine() {
    return inputString[currentLine++];
}

function main() {
    let t = parseInt(readLine());
    let i = 0;
    for(;i<t;i++)
    {
        let n = parseInt(readLine());
        let arr = readLine().trim().split(" ").map((x) => parseInt(x));
        let obj = new Solution();
        let res=obj.find_median(arr);
        console.log(res);
    }
}

// } Driver Code Ends


//User function Template for javascript

/**
 * @param {number[]} arr
 * @return {number}
*/

class Solution {

    find_median(arr){
        //code here
    }
}`,
  },
  {
    langLabel: "C++",
    lang: "cpp",
    code: `//{ Driver Code Starts
#include<bits/stdc++.h> 
using namespace std;

// } Driver Code Ends
class Solution{
public:
    int evenlyDivides(int N){
        //code here
    }
};

//{ Driver Code Starts.
int main() 
{ 
    int t;
    cin>>t;
    while(t--)
    {
        int N;
        cin>>N;
        Solution ob;
        cout << ob.evenlyDivides(N) << endl;
    }
    return 0; 
}
// } Driver Code Ends`,
  },
  {
    langLabel: "Java",
    lang: "java",
    code: `//{ Driver Code Starts
//Initial Template for Java


import java.io.*;
import java.util.*;

class CodingDucks
{
    public static void main(String args[])throws IOException
    {
        BufferedReader read = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(read.readLine());
        while(t-- > 0)
        {
            int N = Integer.parseInt(read.readLine());
            Solution ob = new Solution();
            System.out.println(ob.evenlyDivides(N));
        }
    }
}
// } Driver Code Ends


//User function Template for Java


class Solution{
    static int evenlyDivides(int N){
        // code here
    }
}`,
  },
] as IStarterCode[];
