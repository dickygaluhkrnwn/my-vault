import React from 'react';
import Link from 'next/link';

// --- KOMPONEN BANTUAN UNTUK TYPOGRAPHY YANG RAPI & BERBEDA ---
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-extrabold text-orange-600 dark:text-orange-500 mt-16 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
    {children}
  </h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4 border-l-4 border-orange-500 dark:border-orange-500 pl-4 bg-orange-50/50 dark:bg-orange-900/10 py-1.5 rounded-r-lg">
    {children}
  </h3>
);

const P = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <p className={`text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-5 ${className}`}>
    {children}
  </p>
);

const Ul = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <ul className={`list-disc pl-6 md:pl-8 space-y-3 mb-6 text-gray-600 dark:text-gray-300 marker:text-orange-500 ${className}`}>
    {children}
  </ul>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="text-base md:text-lg leading-relaxed pl-2">{children}</li>
);

const Strong = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <strong className={`font-bold text-gray-900 dark:text-white ${className}`}>{children}</strong>
);

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020202] py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-5xl w-full animate-in fade-in duration-700 slide-in-from-bottom-8">
        
        {/* Header Section */}
        <div className="mb-14 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-orange-600 dark:bg-orange-500 rounded-3xl flex items-center justify-center shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" x2="8" y1="13" y2="13"/>
              <line x1="16" x2="8" y1="17" y2="17"/>
              <line x1="10" x2="8" y1="9" y2="9"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Terms and Conditions
          </h1>
          <div className="inline-block px-5 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
            <p className="text-xs font-bold font-mono tracking-widest uppercase">
              Last updated: March 22, 2026
            </p>
          </div>
        </div>

        {/* Content Document Card */}
        <div className="p-6 sm:p-10 md:p-14 bg-gray-50 dark:bg-[#0a0a0a] rounded-[2rem] md:rounded-[3rem] border border-gray-200 dark:border-gray-800 shadow-sm">
          
          <P className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200">
            Please read these terms and conditions carefully before using Our Service.
          </P>

          <H2>Interpretation and Definitions</H2>
          
          <H3>Interpretation</H3>
          <P>
            The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
          </P>

          <H3>Definitions</H3>
          <P>For the purposes of these Terms and Conditions:</P>
          <Ul>
            <Li><Strong>Application</Strong> means the software program provided by the Company downloaded by You on any electronic device, named Vault ID.</Li>
            <Li><Strong>Application Store</Strong> means the digital distribution service operated and developed by Apple Inc. (Apple App Store) or Google Inc. (Google Play Store) in which the Application has been downloaded.</Li>
            <Li><Strong>Affiliate</Strong> means an entity that controls, is controlled by, or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</Li>
            <Li><Strong>Country</Strong> refers to: Indonesia</Li>
            <Li><Strong>Company</Strong> (referred to as either "the Company", "We", "Us" or "Our" in these Terms and Conditions) refers to Vault ID.</Li>
            <Li><Strong>Device</Strong> means any device that can access the Service such as a computer, a cell phone or a digital tablet.</Li>
            <Li><Strong>Service</Strong> refers to the Application.</Li>
            <Li><Strong>Terms and Conditions</Strong> (also referred to as "Terms") means these Terms and Conditions, including any documents expressly incorporated by reference, which govern Your access to and use of the Service and form the entire agreement between You and the Company regarding the Service.</Li>
            <Li><Strong>Third-Party Social Media Service</Strong> means any services or content (including data, information, products or services) provided by a third party that is displayed, included, made available, or linked to through the Service.</Li>
            <Li><Strong>You</Strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</Li>
          </Ul>

          <H2>Acknowledgment</H2>
          <P>These are the Terms and Conditions governing the use of this Service and the agreement between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</P>
          <P>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</P>
          <P>By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.</P>
          <P>You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.</P>
          <P>Your access to and use of the Service is also subject to Our Privacy Policy, which describes how We collect, use, and disclose personal information. Please read Our Privacy Policy carefully before using Our Service.</P>

          <H2>Links to Other Websites</H2>
          <P>Our Service may contain links to third-party websites or services that are not owned or controlled by the Company.</P>
          <P>The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that the Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such websites or services.</P>
          <P>We strongly advise You to read the terms and conditions and privacy policies of any third-party websites or services that You visit.</P>

          <H2>Links from a Third-Party Social Media Service</H2>
          <P>The Service may display, include, make available, or link to content or services provided by a Third-Party Social Media Service. A Third-Party Social Media Service is not owned or controlled by the Company, and the Company does not endorse or assume responsibility for any Third-Party Social Media Service.</P>
          <P>You acknowledge and agree that the Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with Your access to or use of any Third-Party Social Media Service, including any content, goods, or services made available through them. Your use of any Third-Party Social Media Service is governed by that Third-Party Social Media Service's terms and privacy policies.</P>

          <H2>Termination</H2>
          <P>We may terminate or suspend Your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</P>
          <P>Upon termination, Your right to use the Service will cease immediately.</P>

          <H2>Limitation of Liability</H2>
          <P>Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of these Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.</P>
          <P>To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of these Terms), even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.</P>
          <P>Some states do not allow the exclusion of implied warranties or limitation of liability for incidental or consequential damages, which means that some of the above limitations may not apply. In these states, each party's liability will be limited to the greatest extent permitted by law.</P>

          <H2>"AS IS" and "AS AVAILABLE" Disclaimer</H2>
          <P>The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice. Without limitation to the foregoing, the Company provides no warranty or undertaking, and makes no representation of any kind that the Service will meet Your requirements, achieve any intended results, be compatible or work with any other software, applications, systems or services, operate without interruption, meet any performance or reliability standards or be error free or that any errors or defects can or will be corrected.</P>
          <P>Without limiting the foregoing, neither the Company nor any of the company's provider makes any representation or warranty of any kind, express or implied: (i) as to the operation or availability of the Service, or the information, content, and materials or products included thereon; (ii) that the Service will be uninterrupted or error-free; (iii) as to the accuracy, reliability, or currency of any information or content provided through the Service; or (iv) that the Service, its servers, the content, or e-mails sent from or on behalf of the Company are free of viruses, scripts, trojan horses, worms, malware, timebombs or other harmful components.</P>
          <P>Some jurisdictions do not allow the exclusion of certain types of warranties or limitations on applicable statutory rights of a consumer, so some or all of the above exclusions and limitations may not apply to You. But in such a case the exclusions and limitations set forth in this section shall be applied to the greatest extent enforceable under applicable law.</P>

          <H2>Governing Law</H2>
          <P>The laws of the Country, excluding its conflicts of law rules, shall govern these Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.</P>

          <H2>Disputes Resolution</H2>
          <P>If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.</P>

          <H2>For European Union (EU) Users</H2>
          <P>If You are a European Union consumer, you will benefit from any mandatory provisions of the law of the country in which You are resident.</P>

          <H2>United States Legal Compliance</H2>
          <P>You represent and warrant that (i) You are not located in a country that is subject to the United States government embargo, or that has been designated by the United States government as a "terrorist supporting" country, and (ii) You are not listed on any United States government list of prohibited or restricted parties.</P>

          <H2>Severability and Waiver</H2>
          
          <H3>Severability</H3>
          <P>If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.</P>

          <H3>Waiver</H3>
          <P>Except as provided herein, the failure to exercise a right or to require performance of an obligation under these Terms shall not affect a party's ability to exercise such right or require such performance at any time thereafter nor shall the waiver of a breach constitute a waiver of any subsequent breach.</P>

          <H2>Translation Interpretation</H2>
          <P>These Terms and Conditions may have been translated if We have made them available to You on our Service. You agree that the original English text shall prevail in the case of a dispute.</P>

          <H2>Changes to These Terms and Conditions</H2>
          <P>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</P>
          <P>By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the Service.</P>

          <H2>Contact Us</H2>
          <P>If you have any questions about these Terms and Conditions, You can contact us:</P>
          <Ul>
            <Li>By email: <Strong className="text-orange-600 dark:text-orange-500">ikytech.id@gmail.com</Strong></Li>
          </Ul>

          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
             <P className="text-xs opacity-50 font-mono">Generated using TermsFeed Generator</P>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex justify-center pb-12">
          <Link 
            href="/" 
            className="group flex items-center gap-3 px-8 py-4 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-900/50 shadow-sm transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1.5 transition-transform">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            KEMBALI KE BERANDA
          </Link>
        </div>

      </div>
    </div>
  );
}