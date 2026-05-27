abi <abi/4.0>,
include <tunables/global>

profile open-generative-ai /opt/Open\ Generative\ AI/open-generative-ai flags=(unconfined) {
  userns,
  include if exists <local/open-generative-ai>
}
