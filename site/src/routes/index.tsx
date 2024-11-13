import { ParentProps } from "solid-js"
import { ChevronRightIcon } from "~/components/icons"


export default function Home() {
  return (
    <main>
      <section class="relative bg-gradient-to-b from-primary/5 via-primary/10 to-white overflow-hidden">
        <div class="rotate-3 absolute -inset-x-12 -top-6 h-16 bg-gradient-to-r from-primary-300 via-accent-300 to-negative-300 blur-3xl"></div>
        <div class="absolute inset-0 bg-gradient-[100deg] from-primary-300/10 via-accent-300/10 to-negative-300/10 [-webkit-mask-image:linear-gradient(to_bottom,rgba(255,255,255,1)_75%,rgba(255,255,255,0))]"></div>
        <div class="text-lg relative pt-4 sm:pt-6 px-4 sm:px-8 lg:px-10">
          <nav class="flex items-center gap-6 container max-w-3xl mx-auto ">
            <Logo />
            <div class="flex-grow"></div>
            <LinkButton href="https://app.famcash.com">
              Login
            </LinkButton>
          </nav>
          <div class="pt-32 container max-w-3xl mx-auto ">
            <div class="flex justify-center pb-6 text-base">
              <p class="flex items-center gap-4 text-center border-2 border-accent-700/20 rounded-full px-6 py-1">
                <span>Free</span>
                <span class="h-4 w-0.5 bg-accent-700/20"></span>
                <span>Open Source</span>
              </p>
            </div>
            <h1 class="font-serif text-center text-5xl text-primary-900 pb-6">
              Budgeting For Families.
            </h1>
            <p class="text-lg text-center text-lg">
              The number one money management app designed for families. Accessible from any device, from anywhere. Absolutely free and open source. No ads. No tracking. No tricks.
            </p>
            <div class="flex justify-center pt-6">
              <LinkButton href="https://app.famcash.com">
                Access Now
                <ChevronRightIcon class="w-5 h-5 text-accent-200" />
              </LinkButton>
            </div>
          </div>
          <div class="flex gap-6 justify-center pt-28 pb-8 mx-auto">
            <img class="object-contain"
              src="/images/screenshot-1-laptop.png"
              alt="Screenshot of the FamCash app running on a laptop"
            />
            <img class="object-contain"
              src="/images/screenshot-1-phone.png"
              alt="Screenshot of the FamCash app running on a phone"
            />
          </div>
        </div>
      </section>
      <Section>
        <div class="flex flex-col lg:flex-row lg:justify-center gap-8 mx-auto">
          <div class="max-w-xl">
            <Title>Manage Your Money Together</Title>
            <p class="inline-block"> FamCash is designed to bring families together around their finances. Whether it's budgeting as a couple or planning as a whole family, you can easily invite family members to join your profile, see who’s part of the team, and work together on your financial goals.</p>
          </div>
          <div >
            <img class="object-contain -mb-24"
              src="/images/screenshot-2-cropped.png"
              alt="Screenshot of the FamCash app running on a phone"
            />
          </div>
        </div>
      </Section>
      <Section>
        <div class="flex flex-col lg:flex-row lg:flex-row-reverse lg:justify-center gap-8 mx-auto">
          <div class="max-w-xl">
            <Title>Stop Living Paycheck to Paycheck</Title>
            <p> Take control of your monthly finances with a clear view of your income, expenses, and carryover. By helping you track where your money goes, FamCash offers a way out of the paycheck-to-paycheck cycle. See your total earnings, expenses, and what you have left over each month. Plan today for a more comfortable tomorrow. </p>
          </div>
          <div class="self-end">
            <img class="object-contain -mb-24"
              src="/images/screenshot-6-cropped.png"
              alt="Screenshot of the FamCash app running on a phone"
            />
          </div>
        </div>
      </Section>
      <Section>
        <div class="flex flex-col lg:flex-row lg:justify-center gap-8 mx-auto">
          <div class="max-w-xl">
            <Title>Plan Your Spending</Title>
            <p> Set budgets for different spending categories and track them with ease. FamCash helps you stay mindful of spending by allowing you to plan how much you want to allocate to each category. With a straightforward view of planned versus actual spending, you’ll always know if you're on track with your financial goals. </p>
          </div>
          <div >
            <img class="object-contain -mb-24"
              src="/images/screenshot-3-cropped.png"
              alt="Screenshot of the FamCash app running on a phone"
            />
          </div>
        </div>
      </Section>
      <Section>
        <div class="flex flex-col lg:flex-row lg:flex-row-reverse lg:justify-center gap-8 mx-auto">
          <div class="max-w-xl">
            <Title>Have a Debt-free Life</Title>
            <p> Staying on top of your finances is one of the first steps to becoming debt-free. With FamCash, you can break down your expenses, track recurrent transactions, and gain a clearer picture of where your money is going. Manage your finances with confidence and move closer to a life free of financial stress. </p>
          </div>
          <div class="self-end">
            <img class="object-contain -mb-24"
              src="/images/screenshot-5-cropped.png"
              alt="Screenshot of the FamCash app running on a phone"
            />
          </div>
        </div>
      </Section>
      <Section>
        <div class="flex flex-col lg:flex-row lg:justify-center gap-8 mx-auto">
          <div class="max-w-xl">
            <Title>Access it Anywhere, From Any Device</Title>
            <p> FamCash syncs across all your devices, so your family’s financial information is always available. Whether you’re at home, at work, or on the go, you can keep an eye on your finances and make changes instantly. Your data is saved and synced securely, making it easy for everyone to stay up-to-date. </p>
          </div>
          <div >
            <img class="object-contain -mb-32"
              src="/images/screenshot-1-laptop.png"
              alt="Screenshot of the FamCash app running on a laptop"
            />
            <img class="object-contain -mb-24"
              src="/images/screenshot-1-phone.png"
              alt="Screenshot of the FamCash app running on a phone"
            />
          </div>
        </div>
      </Section>
      <div class="bg-red-500 h-32 bg-gradient-to-b from-white via-primary-100 to-primary-100" ></div>
      <Footer />
    </main >
  )
}


function Section(props: ParentProps) {
  return (
    <section class="relative bg-gradient-to-b from-primary/10 via-primary/5 to-white overflow-hidden">
      <div class="rotate-3 absolute -inset-x-12 -top-6 h-10 bg-gradient-to-r from-primary-300 via-accent-300 to-accent-200 blur-3xl">
      </div>
      <div class="absolute inset-0 bg-gradient-[100deg] from-primary-300/10 via-accent-300/10 to-negative-300/10 [-webkit-mask-image:linear-gradient(to_bottom,rgba(255,255,255,1)_75%,rgba(255,255,255,0))]">
      </div>
      <div class="text-lg  py-24 px-4 sm:px-8 lg:px-10">
        {props.children}
      </div>
    </section>
  )
}

function Title(props: ParentProps) {
  return (
    <h2 class="font-serif text-2xl text-primary-900 pb-6">{props.children}</h2>
  )
}

function LogoMono() {
  return (
    <span class="font-serif text-3xl font-bold">
      <span class="text-primary-50">Fam</span>
      <span class="text-accent-200">cash</span>
    </span>
  )
}
function Logo() {
  return (
    <span class="font-serif text-3xl font-bold">
      <span class="text-primary">Fam</span>
      <span class="text-accent-700">cash</span>
    </span>
  )
}

function LinkButton(props: ParentProps<{ href: string }>) {
  return (
    <a class="inline-flex items-center justify-center border border-transparent hover:border-accent-200 hover:shadow-lg hover:shadow-accent-200 gap-2 h-12 mx-auto transition-colors text-base font-semibold px-6 rounded-full uppercase tracking-wider bg-primary text-white active:bg-primary-800"
      href={props.href}>
      {props.children}
    </a>
  )
}

function Footer() {
  return (
    <footer class="bg-primary-900 pb-6 px-8">
      <div class="flex flex-wrap gap-10 items-center mx-auto max-w-4xl pb-24 pt-10" >
        <LogoMono />
        <div class="flex gap-10" >
          <a class="text-primary-100 text-lg hover:text-accent-200"
            href="https://github.com/pauloevpr/famcash">
            Github
          </a>
          <a class="text-primary-100 text-lg hover:text-accent-200">
            Privacy Policy
          </a>
          <a class="text-primary-100 text-lg hover:text-accent-200">
            FAQ
          </a>
        </div>
      </div>
      <p class="text-center text-primary-100 text-sm">
        Copyright © 2024 Famcash
      </p>
    </footer>
  )
}
