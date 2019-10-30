declare module '@ghaiklor/x509' {
  namespace Certificate {
    interface Issuer {
      countryName: string,
      stateOrProvinceName: string,
      localityName: string,
      organizationName: string,
      organizationalUnitName: string,
      commonName: string,
      emailAddress: string
    }
    interface Subject {
      countryName: string,
      postalCode: string,
      stateOrProvinceName: string,
      localityName: string,
      streetAddress: string,
      organizationName: string,
      organizationalUnitName: string,
      commonName: string,
      emailAddress: string
    }
    interface Extensions {
      keyUsage: string,
      authorityInformationAccess: string,
      certificatePolicies: string,
      basicConstraints: string,
      cRLDistributionPoints: string,
      subjectAlternativeName: string,
      extendedKeyUsage: string,
      authorityKeyIdentifier: string,
      subjectKeyIdentifier: string,
      cTPrecertificateSCTs: string
    }
  }
  interface FullCertificate {
    version: number,
    subject: Certificate.Subject,
    issuer: Certificate.Issuer,
    fingerPrint: string,
    serial: string,
    notBefore: Date,
    notAfter: Date,
    subjectHash: string,
    signatureAlgorithm: string,
    publicKey: { algorithm: string };
    altNames: string[]
    extensions: Certificate.Extensions
  }
  function getAltNames(cert: string): string[];
  function getIssuer(cert: string): Certificate.Issuer;
  function getSubject(cert: string): Certificate.Subject;
  function parseCert(cert: string): FullCertificate
}
