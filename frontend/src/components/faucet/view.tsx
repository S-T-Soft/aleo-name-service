import {QRCodeSVG} from 'qrcode.react';
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import AnchorLink from "@/components/ui/links/anchor-link";


const SendMessageQRCode = () => {
  const {publicKey} = useWallet();

  const phoneNumber = '+18678885688';
  const messageContent = `Send 50 credits to ${publicKey}`;

  const smsURL = `SMSTO:${phoneNumber}:${messageContent}`;

  return (
    <QRCodeSVG value={smsURL} />
  );
};

export default function FaucetView({ ...props }) {
  return (
    <div
      className="relative bg-white mx-auto text-black p-10 rounded-lg w-full max-w-full xs:w-[480px] sm:w-[600px]"
      {...props}
    >
      <div className="font-bold">
        Aleo Faucet
      </div>
      <div className="text-sm">
        All distributed credits are for testing purposes and do not have value.
      </div>
      <div className="font-bold mt-5">
        <span className="bg-gray-700 text-white rounded-full w-6 h-6 inline-block text-center mr-2">1</span>
        Scan QR Code with Cell Phone
      </div>
      <div className="text-sm">
        Then click the prompt shown on your phone to send a text message.
      </div>
      <div className="text-center mt-5">
        <SendMessageQRCode/>
      </div>
      <div className="font-bold mt-5">
        <span className="bg-gray-700 text-white rounded-full w-6 h-6 inline-block text-center mr-2">2</span>
        Confirm and send the text message
      </div>
      <div className="text-sm">
        (May pay a fee to your cell phone provider)
      </div>
      <div className="font-bold mt-5">
        <span className="bg-gray-700 text-white rounded-full w-6 h-6 inline-block text-center mr-2">3</span>
        Got ALEO credits
      </div>
      <div className="text-sm">
        Aleo Faucet will send you 50 credits.
      </div>
      <div className="text-xs text-center mt-10">
        Powered by <AnchorLink href="https://faucet.aleo.org/" target="_blank" className="text-blue-500">Aleo Faucet</AnchorLink>
      </div>
    </div>
  );
}
