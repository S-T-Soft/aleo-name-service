import type { NextPage } from "next";
import SearchView from "@/components/search/view";
import Stats from "@/components/stats";
import {DynamicSocialIcon} from "@/assets/social/DynamicSocialIcon";
import AnchorLink from "@/components/ui/links/anchor-link";
import Button from "@/components/ui/button";
import {useForm, ValidationError} from "@formspree/react";
import React from "react";
import {DynamicAddressIcon} from "@/assets/address/DynamicAddressIcon";
import {SearchIcon} from "@/components/icons/search";
import Logo from "@/components/ui/logo";
import {BuildWithAleoDarkSVG} from "@/assets/icons";

const ANSDesktop: NextPage = () => {
  const [formState, submit] = useForm(process.env.NEXT_PUBLIC_FORM)

  return (
    <div
      className="w-full relative [background:linear-gradient(180deg,_#1d1a18,_#100e0d_7%,_#100e0d_20.5%,_#080707_50%,_#201b18_79.15%,_#0f2224_82.05%,_#042e34_85.04%,_#7bff66_94.11%)] overflow-hidden flex flex-col items-center justify-start pt-[18px] px-0 pb-0 box-border gap-[92px] tracking-[normal] text-center text-9xl-4 text-gainsboro-100 font-azeret mq750:gap-[46px] mq450:gap-[23px]">
      <header
        className="self-stretch flex flex-row items-start justify-start py-0 pr-[35px] pl-[25px] box-border max-w-full text-left text-base text-gainsboro-100 font-azeret">
        <div className="flex-1 flex flex-row items-end justify-between gap-[20px] max-w-full">
          <Logo size='l'/>
          <div className="flex flex-row items-center justify-start gap-[29px] max-w-full">
            <div className="flex flex-col items-start justify-start pt-0 px-0 pb-1 mq450:hidden">
              <nav className="flex flex-row space-x-8">
                <a href="https://docs.aleonames.id/" target={"_blank"} className="hover:text-aquamarine">About</a>
                <a href="https://docs.aleonames.id/developer-guide/integrate-ans-into-frontend" target={"_blank"} className="hover:text-aquamarine">Docs</a>
                <a href="https://docs.aleonames.id/faqs" target={"_blank"} className="hover:text-aquamarine">FAQs</a>
              </nav>
            </div>
            <AnchorLink href="/account">
              <Button><span className="font-bold">Launch App</span></Button>
            </AnchorLink>
          </div>
        </div>
      </header>
      <section
        className="w-[918px] flex flex-col items-center justify-start py-0 px-5 box-border gap-[53px] min-h-[395px] max-w-full text-center text-[71.4px] font-azeret mq450:gap-[26px]">
        <div
          className="self-stretch relative leading-[100%] font-semibold text-transparent !bg-clip-text [background:linear-gradient(94.71deg,_#666,_#9f9ea0_20.85%,_#68ffc9_31.5%,_#7bff66_40%,_#68ffc9_45.1%,_#00505b_67.19%,_#9f9ea0_82.34%,_#666)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] mq450:text-[43px] mq450:leading-[43px] mq1050:text-[57px] mq1050:leading-[57px]">
          <p className="m-0">{`Simplify & Secure`}</p>
          <p className="m-0">your interactions within the Aleo ecosystem</p>
        </div>
        <SearchView/>
        <Stats/>
      </section>
      <section
        className="w-[978px] flex flex-row items-start justify-start py-0 px-5 box-border min-h-[423px] max-w-full text-left text-3xs-5 text-darkgray font-azeret">
        <div
          className="w-[885px] flex flex-row items-center justify-center gap-[50px] max-w-full mq750:flex-wrap mq450:gap-[25px]">
          <div
            className="flex-1 rounded-[13.72px] [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))] flex flex-col items-start justify-start pt-[15px] pb-[31px] pr-[27px] pl-4 box-border gap-[53px] min-w-[396px] max-w-full mq750:gap-[26px] mq750:min-w-full mq450:pt-5 mq450:pb-5 mq450:box-border">
            <div
              className="w-[610.1px] relative rounded-[13.72px] [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))] h-[380px] hidden max-w-full"/>
            <div
              className="self-stretch flex flex-row items-center justify-start gap-[34px] mq750:flex-wrap mq750:gap-[17px]">
              <div
                className="flex-1 flex flex-row items-center justify-start py-0 pr-px pl-0 box-border gap-[12px] min-w-[190px] mq450:flex-wrap">
                <Logo size='s'/>
              </div>
              <div className="flex flex-row items-center justify-start space-x-2">
                <div className="flex items-center">
                  <SearchIcon className="h-[13px] w-[13px] text-aquamarine mr-3"/>
                  <span>My Names Tool Box Docs</span>
                </div>
                <button
                  className="cursor-pointer py-1.5 pr-3.5 pl-3 bg-aquamarine h-[23px] rounded-full flex items-center justify-center ml-2 hover:bg-mediumseagreen">
                  <div className="relative text-3xs-5 leading-[100%] font-azeret text-black text-center">yourname.ans
                  </div>
                </button>
              </div>
            </div>
            <div
              className="w-[298px] h-[239px] flex flex-row items-start justify-start py-0 px-9 box-border text-[26.4px] text-gainsboro-100">
              <div className="self-stretch flex-1 flex flex-col items-start justify-start gap-[20px]">
                <div className="self-stretch flex-1 flex flex-col items-start justify-start gap-[9px]">
                  <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                    <div
                      className="w-[88.7px] flex-1 relative rounded-[50%] [background:conic-gradient(from_180deg_at_50%_50%,_#68ffc9_0deg,_#888_82.8deg,_#5b5b5b_151.2deg,_#7bff66_226.8deg,_#00505b_286.2deg)] z-[1]"/>
                    <div className="flex flex-row items-start justify-start py-0 pr-0 pl-[3px]">
                      <div className="flex flex-row items-end justify-start gap-[7px]">
                        <div className="relative leading-[100%] z-[1] mq450:text-[21px] mq450:leading-[21px]">
                          yourname.ans
                        </div>
                        <div className="relative text-3xs-5 leading-[100%] text-aquamarine z-[1]">
                          Copy
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="self-stretch flex flex-row items-start justify-start py-0 pr-px pl-[3px] text-3xs-5 text-whitesmoke">
                    <div className="relative leading-[100%] whitespace-pre-wrap z-[1]">
                      <span>Addresses</span>
                      <span className="text-darkgray">
                        {" "}
                        Records Subnames Permissions
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="h-[81px] rounded-[13.72px] bg-gray-100 flex flex-col items-start justify-start pt-[15px] pb-4 pr-[26px] pl-[13px] box-border gap-[9px] z-[1] text-3xs-5 text-darkgray">
                  <div className="w-[180.5px] relative rounded-[13.72px] bg-gray-100 h-[80.2px] hidden"/>
                  <div className="relative leading-[100%] z-[2]">Addresses</div>
                  <div className="flex-1 flex flex-row items-center justify-start gap-[11px] text-aquamarine">
                    <button
                      className="cursor-pointer [border:none] pt-[5px] pb-1 pr-[15px] pl-[5px] bg-dimgray-100 self-stretch rounded-[105.56px] flex flex-row items-center justify-start gap-[5px] z-[2]">
                      <div className="h-[30.6px] w-[106.6px] relative rounded-[105.56px] bg-dimgray-100 hidden"/>
                      <div className="h-[21px] w-[21px] relative">
                        <div
                          className="absolute top-[0.2px] left-[-0.3px] rounded-[50%] bg-gainsboro-200 w-full h-full z-[3]"/>
                        <DynamicAddressIcon name={"aleo"} className={"absolute top-[6.5px] left-[6.1px] w-[8.1px] h-[8.7px] z-[4]"}/>
                      </div>
                      <div className="relative text-3xs-5 leading-[100%] font-azeret text-darkgray text-left z-[3]">
                        aleo1idx9...y43
                      </div>
                    </button>
                    <div className="relative leading-[100%] z-[2]">Copy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="w-[225px] flex flex-col items-start justify-start pt-0 px-0 pb-4 box-border min-w-[225px] text-9xl-4 text-gainsboro-100 mq750:flex-1">
            <div className="self-stretch flex flex-col items-start justify-start gap-[31px]">
              <div
                className="w-[181px] relative tracking-[-0.01em] leading-[100%] font-semibold flex items-center mq450:text-4xl mq450:leading-[23px]">
                <span className="w-full">
                  <p className="m-0">Our mission</p>
                </span>
              </div>
              <div className="self-stretch relative text-sm tracking-[-0.01em] leading-[150%] text-darkgray">
                <span>{`Transform complex blockchain addresses into private, easily memorable names, simplifying and securing your interactions within the `}</span>
                <a href={"https://aleo.org/ecosystems/"} target={"_blank"}
                   className="[text-decoration:underline] text-aquamarine">
                  Aleo ecosystem
                </a>
                <span>.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        className="flex flex-wrap items-start justify-start py-0 pr-[34px] pl-5 box-border min-h-[312px] max-w-full text-left text-9xl-4 text-gainsboro-100 font-azeret">
        <div className="flex-1 flex flex-row flex-wrap items-start justify-start [row-gap:20px] max-w-full">
          <div className="w-full flex flex-col items-start justify-start pt-[27px] px-0 pb-0 box-border">
            <div
              className="self-stretch relative tracking-[-0.01em] leading-[100%] font-semibold text-center mq450:text-4xl mq450:leading-[23px]">
              How it works
            </div>
          </div>
          <div className="flex flex-row flex-wrap items-start justify-start w-full">
            <div key={1}
                 className="flex flex-col w-full md:w-1/3 items-start justify-start pt-6 px-0 pb-0 box-border">
              <div className="flex items-center justify-center lg:justify-start">
                <div
                  className={`text-61xl leading-[150%] font-aleofont-sans text-darkslategray-200 inline-block shrink-0 z-[1] mq450:leading-[48px] mq1050:leading-[72px]`}>
                  {1}
                </div>
                <div className="ml-4 lg:ml-8 self-stretch flex flex-col items-start justify-start gap-[48px]">
                  <div className="relative text-lg tracking-[-0.01em] leading-[150%] font-semibold">
                    Search and register
                  </div>
                  <div className="relative text-sm tracking-[-0.01em] leading-[150%] text-darkgray">
                    <p className="m-0">{`Find your ideal ANS `}</p>
                    <p className="m-0">{`name and register it. `}</p>
                    <p className="m-0">Simple, fast, and secure.</p>
                  </div>
                </div>
              </div>
            </div>
            <div key={2}
                 className="flex flex-col w-full md:w-1/3 items-start justify-start pt-6 px-0 pb-0 box-border">
              <div className="flex items-center justify-center lg:justify-start">
                <div
                  className={`text-61xl leading-[150%] font-aleofont-sans text-darkslategray-200 inline-block shrink-0 z-[1] mq450:leading-[48px] mq1050:leading-[72px] lg:border-l-[1px] border-solid border-darkslategray-300 lg:pl-8`}>
                  {2}
                </div>
                <div className="ml-4 lg:ml-8 self-stretch flex flex-col items-start justify-start gap-[48px]">
                  <div className="relative text-lg tracking-[-0.01em] leading-[150%] font-semibold">
                    Manage your domain
                  </div>
                  <div className="relative text-sm tracking-[-0.01em] leading-[150%] text-darkgray">
                    <p className="m-0">{`Easily manage your ANS domain.`}</p>
                    <p className="m-0">{`Set up profiles, configure settings,`}</p>
                    <p className="m-0">and control your digital identity.</p>
                  </div>
                </div>
              </div>
            </div>
            <div key={3}
                 className="flex flex-col w-full md:w-1/3 items-start justify-start pt-6 px-0 pb-0 box-border">
              <div className="flex items-center justify-center lg:justify-start">
                <div
                  className={`text-61xl leading-[150%] font-aleofont-sans text-darkslategray-200 inline-block shrink-0 z-[1] mq450:leading-[48px] mq1050:leading-[72px] lg:border-l-[1px] border-solid border-darkslategray-300 lg:pl-8`}>
                  {3}
                </div>
                <div className="ml-4 lg:ml-8 self-stretch flex flex-col items-start justify-start gap-[30px]">
                  <div className="relative text-lg tracking-[-0.01em] leading-[150%] font-semibold">
                    Integrate and use
                  </div>
                  <div className="relative text-sm tracking-[-0.01em] leading-[150%] text-darkgray">
                    <p className="m-0">Seamlessly integrate your ANS</p>
                    <p className="m-0">domain with wallets and apps. Use</p>
                    <p className="m-0">your ANS name across the Aleo</p>
                    <p className="m-0">ecosystem for a unified experience.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-[736px] flex-row items-start justify-start pt-0 px-5 pb-[22px] box-border max-w-full">
        <div className="flex-1 flex-row items-start justify-start py-0 pr-px pl-0 box-border relative max-w-full">
          <div className="w-full items-start justify-start pt-[27px] px-0 pb-0 box-border">
            <div
              className="self-stretch relative tracking-[-0.01em] leading-[100%] font-semibold text-center mq450:text-4xl mq450:leading-[23px]">
              Connect with us
            </div>
          </div>
          <div className="w-full flex mt-5 text-base text-aquamarine">
            <div className="w-1/4 flex flex-col items-center justify-start py-0 px-2">
              <a href={"https://aleonames.medium.com"} target={"_blank"}
                 className="rounded-full w-full h-[96px] flex items-center justify-center overflow-hidden">
                <DynamicSocialIcon name={"com.medium"} fill="rgb(38 117 130 / var(--tw-text-opacity))" width={60}
                                   height={60}/>
              </a>
              <div>
                <a href={"https://aleonames.medium.com"} target={"_blank"} className="mt-[-89px] hover:underline">
                  Read Blog
                </a>
              </div>
            </div>
            <div className="w-1/4 flex flex-col items-center justify-start py-0 px-2">
              <a href={"https://www.youtube.com/@aleonames"} target={"_blank"}
                 className="rounded-full w-full h-[96px] flex items-center justify-center overflow-hidden">
                <DynamicSocialIcon name={"com.youtube"} fill="rgb(38 117 130 / var(--tw-text-opacity))" width={60}
                                   height={60}/>
              </a>
              <div>
                <a href={"https://www.youtube.com/@aleonames"} target={"_blank"} className="mt-[-89px] hover:underline">
                  View Youtube
                </a>
              </div>
            </div>
            <div className="w-1/4 flex flex-col items-center justify-start py-0 px-2">
              <a href={"https://discord.gg/uvWJehUmyK"} target={"_blank"}
                 className="rounded-full w-full h-[96px] flex items-center justify-center overflow-hidden">
                <DynamicSocialIcon name={"com.discord"} fill="rgb(38 117 130 / var(--tw-text-opacity))" width={60}
                                   height={60}/>
              </a>
              <div>
                <a href={"https://discord.gg/uvWJehUmyK"} target={"_blank"} className="mt-[-89px] hover:underline">
                  Join Discord
                </a>
              </div>
            </div>
            <div className="w-1/4 flex flex-col items-center justify-start py-0 px-2">
              <a href={"https://x.com/aleonames"} target={"_blank"}
                 className="rounded-full w-full h-[96px] flex items-center justify-center overflow-hidden">
                <DynamicSocialIcon name={"com.twitter"} fill="rgb(38 117 130 / var(--tw-text-opacity))" width={60}
                                   height={60}/>
              </a>
              <div>
                <a href={"https://x.com/aleonames"} target={"_blank"} className="mt-[-89px] hover:underline">
                  Follow on X
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer
        className="bg-gray-200 text-center text-lg text-cobalt-100 font-azeret pt-[51px] pb-[55px] px-[57px] md:px-[38px] w-full">
        {/* Content container */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 w-full">

          {/* Left side content */}
          <div className="flex flex-col space-y-8 w-full">
            <div className="text-left font-medium leading-[32px]">
              Stay informed and never miss an update
            </div>
            <form onSubmit={submit}>
              <div className="self-stretch flex flex-row flex-wrap items-start justify-center gap-[16px] max-w-full">

                <div
                  className="flex-1 rounded-[100px] box-border flex flex-row items-center justify-start py-3 px-6 min-w-[108px] max-w-full z-[1] border-[1px] border-solid border-darkslategray-200">
                  <input
                    className="w-full border-none outline-none font-semibold font-azeret text-base bg-[transparent] h-6 relative tracking-[-0.5px] leading-[24px] text-white text-left inline-block"
                    placeholder="Email address"
                    type="email"
                    id="email"
                    name="email"
                  />
                  <ValidationError
                    prefix="Email"
                    field="email"
                    errors={formState.errors}
                  />
                </div>
                <button
                  disabled={formState.submitting}
                  type={"submit"}
                  className="cursor-pointer [border:none] p-3 bg-darkslategray-200 w-[127px] rounded-full flex flex-row items-center justify-center box-border z-[1] hover:bg-teal">
                  <div
                    className="relative text-base tracking-[-0.5px] leading-[24px] font-semibold font-azeret text-cobalt-100 text-left">
                    Subscribe
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Right side content */}
          <div className="flex flex-col items-center space-y-8 md:items-end justify-between w-full">
            {/* Navigation at the top */}
            <nav className="flex flex-row space-x-8">
              <a href="https://docs.aleonames.id" target={"_blank"} className="text-aquamarine hover:underline">About</a>
              <a href="https://docs.aleonames.id/developer-guide/integrate-ans-into-frontend" target={"_blank"} className="text-aquamarine hover:underline">Docs</a>
              <a href="https://docs.aleonames.id/privacy-policy" target={"_blank"} className="text-aquamarine hover:underline">Privacy Policy</a>
            </nav>

            {/* Image at the bottom */}
            <BuildWithAleoDarkSVG className="w-[172.6px] h-[42px] object-cover gap-[16px] bg-white rounded-lg"/>
          </div>


        </div>
        <div className="text-slate-300 text-base leading-[24px] text-center mt-5">
          ©2023 Aleo Name Service, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
};

export default ANSDesktop;
