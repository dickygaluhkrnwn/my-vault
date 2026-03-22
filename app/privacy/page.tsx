import React from 'react';
import Link from 'next/link';

// --- KOMPONEN BANTUAN UNTUK TYPOGRAPHY YANG RAPI & BERBEDA ---
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-16 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
    {children}
  </h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4 border-l-4 border-blue-500 dark:border-blue-400 pl-4 bg-blue-50/50 dark:bg-blue-900/10 py-1.5 rounded-r-lg">
    {children}
  </h3>
);

const H4 = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-8 mb-3 bg-gray-100 dark:bg-gray-800 inline-block px-3 py-1 rounded-md">
    {children}
  </h4>
);

const P = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <p className={`text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-5 ${className}`}>
    {children}
  </p>
);

const Ul = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <ul className={`list-disc pl-6 md:pl-8 space-y-3 mb-6 text-gray-600 dark:text-gray-300 marker:text-blue-500 ${className}`}>
    {children}
  </ul>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="text-base md:text-lg leading-relaxed pl-2">{children}</li>
);

const Strong = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <strong className={`font-bold text-gray-900 dark:text-white ${className}`}>{children}</strong>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020202] py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
      {/* 🚨 DIUBAH: max-w-4xl menjadi max-w-5xl agar lebih lebar dan lega */}
      <div className="max-w-5xl w-full animate-in fade-in duration-700 slide-in-from-bottom-8">
        
        {/* Header Section */}
        <div className="mb-14 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-blue-600 dark:bg-blue-500 rounded-3xl flex items-center justify-center shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <div className="inline-block px-5 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
            <p className="text-xs font-bold font-mono tracking-widest uppercase">
              Last updated: March 22, 2026
            </p>
          </div>
        </div>

        {/* Content Document Card */}
        <div className="p-6 sm:p-10 md:p-14 bg-gray-50 dark:bg-[#0a0a0a] rounded-[2rem] md:rounded-[3rem] border border-gray-200 dark:border-gray-800 shadow-sm">
          
          <P className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200">
            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
          </P>
          <P>
            We use Your Personal Data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the TermsFeed Privacy Policy Generator.
          </P>

          <H2>Interpretation and Definitions</H2>
          
          <H3>Interpretation</H3>
          <P>
            The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
          </P>

          <H3>Definitions</H3>
          <P>For the purposes of this Privacy Policy:</P>
          <Ul>
            <Li><Strong>Account</Strong> means a unique account created for You to access our Service or parts of our Service.</Li>
            <Li><Strong>Affiliate</Strong> means an entity that controls, is controlled by, or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</Li>
            <Li><Strong>Application</Strong> refers to Vault ID, the software program provided by the Company.</Li>
            <Li><Strong>Company</Strong> (referred to as either "the Company", "We", "Us" or "Our" in this Privacy Policy) refers to Vault ID.</Li>
            <Li><Strong>Country</Strong> refers to: Indonesia</Li>
            <Li><Strong>Device</Strong> means any device that can access the Service such as a computer, a cell phone or a digital tablet.</Li>
            <Li><Strong>Personal Data</Strong> (or "Personal Information") is any information that relates to an identified or identifiable individual.</Li>
            <Li>We use "Personal Data" and "Personal Information" interchangeably unless a law uses a specific term.</Li>
            <Li><Strong>Service</Strong> refers to the Application.</Li>
            <Li><Strong>Service Provider</Strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.</Li>
            <Li><Strong>Usage Data</Strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</Li>
            <Li><Strong>You</Strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</Li>
          </Ul>

          <H2>Collecting and Using Your Personal Data</H2>
          
          <H3>Types of Data Collected</H3>
          
          <H4>Personal Data</H4>
          <P>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:</P>
          <Ul>
            <Li>Email address</Li>
            <Li>First name and last name</Li>
          </Ul>

          <H4>Usage Data</H4>
          <P>Usage Data is collected automatically when using the Service.</P>
          <P>Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</P>
          <P>When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device's unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.</P>
          <P>We may also collect information that Your browser sends whenever You visit Our Service or when You access the Service by or through a mobile device.</P>

          <H3>Use of Your Personal Data</H3>
          <P>The Company may use Personal Data for the following purposes:</P>
          <Ul>
            <Li><Strong>To provide and maintain our Service</Strong>, including to monitor the usage of our Service.</Li>
            <Li><Strong>To manage Your Account:</Strong> to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</Li>
            <Li><Strong>For the performance of a contract:</Strong> the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</Li>
            <Li><Strong>To contact You:</Strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.</Li>
            <Li><Strong>To provide You</Strong> with news, special offers, and general information about other goods, services and events which We offer that are similar to those that you have already purchased or inquired about unless You have opted not to receive such information.</Li>
            <Li><Strong>To manage Your requests:</Strong> To attend and manage Your requests to Us.</Li>
            <Li><Strong>For business transfers:</Strong> We may use Your Personal Data to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets, whether as a going concern or as part of bankruptcy, liquidation, or similar proceeding, in which Personal Data held by Us about our Service users is among the assets transferred.</Li>
            <Li><Strong>For other purposes:</Strong> We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.</Li>
          </Ul>

          <P>We may share Your Personal Data in the following situations:</P>
          <Ul>
            <Li><Strong>With Service Providers:</Strong> We may share Your Personal Data with Service Providers to monitor and analyze the use of our Service, to contact You.</Li>
            <Li><Strong>For business transfers:</Strong> We may share or transfer Your Personal Data in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company.</Li>
            <Li><Strong>With Affiliates:</Strong> We may share Your Personal Data with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us.</Li>
            <Li><Strong>With business partners:</Strong> We may share Your Personal Data with Our business partners to offer You certain products, services or promotions.</Li>
            <Li><Strong>With other users:</Strong> If Our Service offers public areas, when You share Personal Data or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside.</Li>
            <Li><Strong>With Your consent:</Strong> We may disclose Your Personal Data for any other purpose with Your consent.</Li>
          </Ul>

          <H2>Retention of Your Personal Data</H2>
          <P>The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if We are required to retain Your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.</P>
          <P>Where possible, We apply shorter retention periods and/or reduce identifiability by deleting, aggregating, or anonymizing data. Unless otherwise stated, the retention periods below are maximum periods ("up to") and We may delete or anonymize data sooner when it is no longer needed for the relevant purpose. We apply different retention periods to different categories of Personal Data based on the purpose of processing and legal obligations:</P>
          
          <Ul>
            <Li>
              <Strong>Account Information</Strong>
              <Ul className="mt-3 mb-1 pl-4 md:pl-6 border-l-2 border-gray-200 dark:border-gray-800 list-circle">
                  <Li>User Accounts: retained for the duration of your account relationship plus up to 24 months after account closure to handle any post-termination issues or resolve disputes.</Li>
              </Ul>
            </Li>
            <Li>
              <Strong>Customer Support Data</Strong>
              <Ul className="mt-3 mb-1 pl-4 md:pl-6 border-l-2 border-gray-200 dark:border-gray-800 list-circle">
                  <Li>Support tickets and correspondence: up to 24 months from the date of ticket closure to resolve follow-up inquiries, track service quality, and defend against potential legal claims</Li>
                  <Li>Chat transcripts: up to 24 months for quality assurance and staff training purposes.</Li>
              </Ul>
            </Li>
            <Li>
              <Strong>Usage Data</Strong>
              <Ul className="mt-3 mb-1 pl-4 md:pl-6 border-l-2 border-gray-200 dark:border-gray-800 list-circle">
                  <Li>Application usage statistics: up to 24 months to understand feature adoption and service improvements.</Li>
                  <Li>Server logs (IP addresses, access times): up to 24 months for security monitoring and troubleshooting purposes.</Li>
              </Ul>
            </Li>
          </Ul>
          
          <P>Usage Data is retained in accordance with the retention periods described above, and may be retained longer only where necessary for security, fraud prevention, or legal compliance.</P>
          <P>We may retain Personal Data beyond the periods stated above for different reasons:</P>
          <Ul>
            <Li><Strong>Legal obligation:</Strong> We are required by law to retain specific data (e.g., financial records for tax authorities).</Li>
            <Li><Strong>Legal claims:</Strong> Data is necessary to establish, exercise, or defend legal claims.</Li>
            <Li><Strong>Your explicit request:</Strong> You ask Us to retain specific information.</Li>
            <Li><Strong>Technical limitations:</Strong> Data exists in backup systems that are scheduled for routine deletion.</Li>
          </Ul>
          
          <P>You may request information about how long We will retain Your Personal Data by contacting Us.</P>
          <P>When retention periods expire, We securely delete or anonymize Personal Data according to the following procedures:</P>
          <Ul>
            <Li><Strong>Deletion:</Strong> Personal Data is removed from Our systems and no longer actively processed.</Li>
            <Li><Strong>Backup retention:</Strong> Residual copies may remain in encrypted backups for a limited period consistent with our backup retention schedule and are not restored except where necessary for security, disaster recovery, or legal compliance.</Li>
            <Li><Strong>Anonymization:</Strong> In some cases, We convert Personal Data into anonymous statistical data that cannot be linked back to You. This anonymized data may be retained indefinitely for research and analytics.</Li>
          </Ul>

          <H2>Transfer of Your Personal Data</H2>
          <P>Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ from those from Your jurisdiction.</P>
          <P>Where required by applicable law, We will ensure that international transfers of Your Personal Data are subject to appropriate safeguards and supplementary measures where appropriate. The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.</P>

          <H2>Delete Your Personal Data</H2>
          <P>You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You.</P>
          <P>Our Service may give You the ability to delete certain information about You from within the Service.</P>
          <P>You may update, amend, or delete Your information at any time by signing in to Your Account, if you have one, and visiting the account settings section that allows you to manage Your personal information. You may also contact Us to request access to, correct, or delete any Personal Data that You have provided to Us.</P>
          <P>Please note, however, that We may need to retain certain information when we have a legal obligation or lawful basis to do so.</P>

          <H2>Disclosure of Your Personal Data</H2>
          
          <H3>Business Transactions</H3>
          <P>If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.</P>

          <H3>Law enforcement</H3>
          <P>Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).</P>

          <H3>Other legal requirements</H3>
          <P>The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</P>
          <Ul>
            <Li>Comply with a legal obligation</Li>
            <Li>Protect and defend the rights or property of the Company</Li>
            <Li>Prevent or investigate possible wrongdoing in connection with the Service</Li>
            <Li>Protect the personal safety of Users of the Service or the public</Li>
            <Li>Protect against legal liability</Li>
          </Ul>

          <H2>Security of Your Personal Data</H2>
          <P>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially reasonable means to protect Your Personal Data, We cannot guarantee its absolute security.</P>

          <H2>Children's Privacy</H2>
          <P>Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable information from anyone under the age of 16. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 16 without verification of parental consent, We take steps to remove that information from Our servers.</P>
          <P>If We need to rely on consent as a legal basis for processing Your information and Your country requires consent from a parent, We may require Your parent's consent before We collect and use that information.</P>

          <H2>Links to Other Websites</H2>
          <P>Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.</P>
          <P>We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</P>

          <H2>Changes to this Privacy Policy</H2>
          <P>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.</P>
          <P>We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.</P>
          <P>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</P>

          <H2>Contact Us</H2>
          <P>If you have any questions about this Privacy Policy, You can contact us:</P>
          <Ul>
            <Li>By email: <Strong className="text-blue-600 dark:text-blue-400">ikytech.id@gmail.com</Strong></Li>
          </Ul>

          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
             <P className="text-xs opacity-50 font-mono">Generated using Privacy Policies Generator</P>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex justify-center pb-12">
          <Link 
            href="/" 
            className="group flex items-center gap-3 px-8 py-4 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/50 shadow-sm transition-all"
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